import { useState } from '#imports'
import type { LegalDocId } from '~/types/legal'

const VALID_DOCS: readonly LegalDocId[] = ['privacy', 'requisites', 'cookie']

const isValidDoc = (value: unknown): value is LegalDocId =>
  typeof value === 'string' && (VALID_DOCS as readonly string[]).includes(value)

/**
 * Глобальное состояние правовой модалки.
 *
 * Источник истины — useState (SSR-safe, общий для всех компонентов).
 * Дополнительно синхронизируется с query `?legal=<doc>` через history.replaceState,
 * что даёт документам стабильный, шарящийся адрес (нужен для уведомления РКН,
 * подписей в письмах, рекламных кабинетов) БЕЗ навигации Vue Router —
 * поэтому скролл Lenis и анимации секций не затрагиваются.
 */
export function useLegalModal() {
  const activeDoc = useState<LegalDocId | null>('legal-active-doc', () => null)

  const syncUrl = (doc: LegalDocId | null) => {
    if (!import.meta.client) return
    const url = new URL(window.location.href)
    if (doc) url.searchParams.set('legal', doc)
    else url.searchParams.delete('legal')
    window.history.replaceState(window.history.state, '', url)
  }

  const open = (doc: LegalDocId) => {
    activeDoc.value = doc
    syncUrl(doc)
  }

  const close = () => {
    activeDoc.value = null
    syncUrl(null)
  }

  /** Восстановление состояния из URL при первой загрузке (вызывается на клиенте). */
  const initFromUrl = () => {
    if (!import.meta.client || activeDoc.value !== null) return
    const param = new URLSearchParams(window.location.search).get('legal')
    if (isValidDoc(param)) activeDoc.value = param
  }

  return { activeDoc, open, close, initFromUrl }
}
