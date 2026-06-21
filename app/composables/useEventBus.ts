import { onBeforeUnmount } from 'vue'
import type { PriceOption } from '~/types/organic'

type EventMap = {
  'preloader-done': void
  'menu-state': boolean
  'nav-goto': string
  'about-state': boolean
  'portfolio-state': boolean
  'approach-state': { active: boolean; step: number }
  'price-state': boolean
  'price-update': { active: boolean; options: PriceOption[]; totalPrice: number }
  'price-drag': { id: string; x: number; y: number }
  'contact-state': { active: boolean; step: number; typing: boolean }
  'techstack-state': { active: boolean; hoveredIndex?: number }
  'finish-preloader': void
  'section-change': string
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
    try {
      onBeforeUnmount(() => {
        listeners.get(event)?.delete(handler as (...args: unknown[]) => void)
      })
    } catch (e) {
      // If used outside of setup, no auto-cleanup (must be done manually if needed)
    }
  }

  return { emit, on }
}
