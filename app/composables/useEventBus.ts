import { onBeforeUnmount, getCurrentInstance } from 'vue'
import type { PriceOption } from '~/types/organic'

/**
 * Карта событий EventBus (12 основных типов).
 * 
 * Потоки событий (Mermaid):
 * ```mermaid
 * flowchart TD
 *     Component[UI Компонент] -->|emit('event', payload)| EventBus
 *     EventBus -->|on('event')| OrganicSync[useOrganicSync / GSAP Animations]
 *     EventBus -->|on('event')| LocalListeners[Другие Компоненты]
 *     
 *     style EventBus fill:#f9f,stroke:#333,stroke-width:2px
 * ```
 */
type EventMap = {
  /** Уведомляет, что прелоадер завершил свою анимацию (сфера может раскрыться) */
  'preloader-done': undefined
  /** Состояние глобального меню (открыто/закрыто) */
  'menu-state': boolean
  /** Команда на переход к секции (вызывается из меню с задержкой) */
  'nav-goto': string
  /** Состояние секции About */
  'about-state': boolean
  /** Состояние секции Portfolio */
  'portfolio-state': boolean
  /** Состояние секции Approach и текущий активный шаг (0-5) */
  'approach-state': { active: boolean; step: number }
  /** Состояние секции Price (выключена или включена) */
  'price-state': boolean
  /** Обновление конфигурации цены, когда опции меняются */
  'price-update': { active: boolean; options: PriceOption[]; totalPrice: number }
  /** Перетаскивание сферы в Price-секции (меняет xOffset, yOffset) */
  'price-drag': { id: string; x: number; y: number }
  /** Состояние контактной формы (шаг и факт набора текста - typing) */
  'contact-state': { active: boolean; step: number; typing: boolean }
  /** Состояние TechStack (при ховере или открытии) */
  'techstack-state': { active: boolean; hoveredIndex?: number }
  /** Сигнал самому прелоадеру на завершение/скрытие */
  'finish-preloader': undefined
  /** Сообщает о смене текущей секции при скролле */
  'section-change': string
  /** Состояние модального окна сравнения подходов в Price */
  'price-modal-state': { active: boolean }
  /** Сигнал закрытия TechStack из глобальной шапки */
  'techstack-close': undefined
  /** Сигнал закрытия PriceDevModeModal из глобальной шапки */
  'price-modal-close': undefined
}

declare module '#app' {
  interface NuxtApp {
    _eventBus?: Map<string, Set<(...args: unknown[]) => void>>
  }
}

export function useEventBus() {
  const nuxtApp = useNuxtApp()
  
  // Attach to nuxtApp to avoid SSR cross-request state leakage
  if (!nuxtApp._eventBus) {
    nuxtApp._eventBus = new Map<string, Set<(...args: unknown[]) => void>>()
  }
  const listeners: Map<string, Set<(...args: unknown[]) => void>> = nuxtApp._eventBus

  const emit = <K extends keyof EventMap>(event: K, payload?: EventMap[K]) => {
    listeners.get(event)?.forEach(fn => fn(payload))
  }

  const on = <K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set())
    }
    listeners.get(event)!.add(handler as (...args: unknown[]) => void)
    
    // Auto-cleanup when used inside a component's setup function
    if (getCurrentInstance()) {
      onBeforeUnmount(() => {
        listeners.get(event)?.delete(handler as (...args: unknown[]) => void)
      })
    }
  }

  const off = <K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) => {
    listeners.get(event)?.delete(handler as (...args: unknown[]) => void)
  }

  return { emit, on, off }
}
