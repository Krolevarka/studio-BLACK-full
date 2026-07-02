import type { RequisiteItem } from '~/types/legal'

// Публичные контакты студии (реальные — используются в футере и письмах).
export const OPERATOR_SHORT = 'KVAZAR WEB STUDIO'
export const OPERATOR_EMAIL = 'kvazarweb@gmail.com'
export const OPERATOR_TELEGRAM = '@kvazarweb'

// Полное наименование оператора для текста Политики.
// TODO: заменить заглушку на реальные данные (ИП/ООО) после регистрации.
export const OPERATOR_LEGAL_NAME = '[ Оператор — уточняется ]'

// Реквизиты оператора. Значения с isPlaceholder — временные заглушки,
// подлежат замене на реальные данные (ИП/ООО, ОГРН/ИНН, адрес).
export const requisites: RequisiteItem[] = [
  { label: 'Оператор', value: OPERATOR_LEGAL_NAME, isPlaceholder: true },
  { label: 'Организационно-правовая форма', value: 'ИП / ООО — уточняется', isPlaceholder: true },
  { label: 'ОГРН / ОГРНИП', value: '— уточняется —', isPlaceholder: true },
  { label: 'ИНН', value: '— уточняется —', isPlaceholder: true },
  { label: 'Юридический адрес', value: '— уточняется —', isPlaceholder: true },
  { label: 'E-mail для обращений', value: OPERATOR_EMAIL },
  { label: 'Telegram', value: OPERATOR_TELEGRAM },
]
