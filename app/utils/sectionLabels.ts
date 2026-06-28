/**
 * Канонический источник правды для меток секций.
 *
 * Эти строки — двойного назначения: они и подпись кнопки меню в шапке (отображаемый текст),
 * и ключ события `section-change` на шине (useEventBus). Раньше они дублировались литералами
 * по ~24 точкам; здесь собран навигационно-логический слой (эмиттер index.vue, OrganicCore,
 * useSectionTransition, usePriceDrag), чтобы смена текста метки не рассинхронила слушателей.
 *
 * ВНИМАНИЕ: per-секционные компоненты (sections/**) пока хранят свой литерал 1:1 со своим
 * дисплеем — при изменении значения здесь синхронизируй и их.
 */
export const SECTION = {
  HERO: '[ Студия ]',
  ABOUT: '[ О нас ]',
  APPROACH: '[ Наш Подход ]',
  PORTFOLIO: '[ Проекты ]',
  PRICE: '[ Прайс ]',
  CONTACT: '[ Контакты ]'
} as const

export type SectionLabel = (typeof SECTION)[keyof typeof SECTION]

/** Порядок секций для навигации (соответствует массиву sections в pages/index.vue). */
export const SECTION_LABELS: SectionLabel[] = [
  SECTION.HERO,
  SECTION.ABOUT,
  SECTION.APPROACH,
  SECTION.PORTFOLIO,
  SECTION.PRICE,
  SECTION.CONTACT
]

/** Секции, на которых «жидкая сфера» гасится на мобильных (тяжёлые/отвлекающие вкладки). */
export const MOBILE_SPHERE_HIDDEN: Set<string> = new Set([
  SECTION.APPROACH,
  SECTION.PORTFOLIO,
  SECTION.PRICE,
  SECTION.CONTACT
])
