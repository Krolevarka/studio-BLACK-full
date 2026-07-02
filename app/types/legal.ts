// Типы правового модуля (Политика ПД, Реквизиты, Cookie).
// No-Any: все структуры документов строго типизированы.

/** Идентификаторы правовых документов = ключи вкладок модалки и значение query `?legal=` */
export type LegalDocId = 'privacy' | 'requisites' | 'cookie'

/** Смысловой раздел документа (заголовок + абзацы и/или маркированный список) */
export interface LegalSection {
  id: string
  title: string
  paragraphs?: string[]
  list?: string[]
}

/** Правовой документ, отображаемый в виде вкладки модалки */
export interface LegalDocument {
  id: LegalDocId
  /** Короткая подпись вкладки */
  tab: string
  /** Заголовок в шапке модалки */
  title: string
  sections: LegalSection[]
}

/** Строка реквизитов оператора (лейбл + значение; заглушки помечаются флагом) */
export interface RequisiteItem {
  label: string
  value: string
  /** true — значение является заглушкой и требует заполнения реальными данными */
  isPlaceholder?: boolean
}

/** Выбор пользователя по cookie */
export type CookieChoice = 'accepted' | 'necessary'
