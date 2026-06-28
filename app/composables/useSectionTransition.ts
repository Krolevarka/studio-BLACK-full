import { useState } from '#imports'
import { SECTION } from '~/utils/sectionLabels'

/**
 * Единый источник правды для переходов между секциями.
 *
 * Модель таймингов — ПОСЛЕДОВАТЕЛЬНАЯ:
 *  - activeLabel  меняется в МОМЕНТ старта скролла (index.vue -> gotoSection).
 *    Как только activeLabel != метки секции, эта секция начинает ИСЧЕЗАТЬ.
 *  - arrivedLabel меняется по ПРИБЫТИИ (onComplete у Lenis.scrollTo).
 *    Только когда arrivedLabel == метке секции, её контент НАЧИНАЕТ ПОЯВЛЯТЬСЯ.
 *
 * Секция считается раскрытой только если activeLabel === arrivedLabel === её метка.
 * Это даёт эффект: старая страница плавно гаснет -> идёт переход -> новая проявляется.
 *
 * arrivedLabel инициализируется пустой строкой: даже Hero не появится, пока
 * index.vue не выставит его по событию `preloader-done` (или по фолбэк-таймеру).
 */
export const HERO_LABEL = SECTION.HERO

export function useSectionTransition() {
  // useState — SSR-безопасный синглтон, общий для всех компонентов
  const activeLabel = useState<string>('section-active-label', () => HERO_LABEL)
  const arrivedLabel = useState<string>('section-arrived-label', () => '')

  return { activeLabel, arrivedLabel }
}
