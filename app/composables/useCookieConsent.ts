import { computed } from 'vue'
import { useState } from '#imports'
import { LEGAL_VERSION } from '~/data/legal/meta'
import type { CookieChoice } from '~/types/legal'

interface CookieRecord {
  choice: CookieChoice
  version: string
  ts: number
}

const STORAGE_KEY = 'kvazar_cookie_consent'

/**
 * Cookie-согласие с сохранением в localStorage.
 * Привязано к LEGAL_VERSION: при смене версии Политики согласие сбрасывается,
 * и баннер показывается повторно.
 */
export function useCookieConsent() {
  const choice = useState<CookieChoice | null>('cookie-choice', () => null)
  const hydrated = useState<boolean>('cookie-hydrated', () => false)

  /** Загрузка сохранённого решения из localStorage (только на клиенте). */
  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const rec = JSON.parse(raw) as CookieRecord
        if (rec?.version === LEGAL_VERSION && (rec.choice === 'accepted' || rec.choice === 'necessary')) {
          choice.value = rec.choice
        }
      }
    } catch {
      // Повреждённое/недоступное хранилище — игнорируем, покажем баннер заново
    }
    hydrated.value = true
  }

  const persist = (value: CookieChoice) => {
    choice.value = value
    if (!import.meta.client) return
    try {
      const record: CookieRecord = { choice: value, version: LEGAL_VERSION, ts: Date.now() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
    } catch {
      // localStorage недоступен (приватный режим и т.п.) — решение живёт в памяти сессии
    }
  }

  return {
    choice,
    hydrated,
    hydrate,
    accept: () => persist('accepted'),
    acceptNecessary: () => persist('necessary'),
    hasConsented: computed(() => choice.value !== null)
  }
}
