import { ref, shallowReactive } from 'vue'
import type { Ref } from 'vue'
import type { ShapeState, StateConfig, PriceOption } from '~/types/organic'
import { useNuxtApp } from '#imports'

declare module '#app' {
  interface NuxtApp {
    _organicCoreState?: OrganicCoreState
  }
}

export interface OrganicCoreState {
  shapes: ShapeState[]
  nextShapeId: number
  stateConfig: StateConfig
  isPreloading: Ref<boolean>
  isAboutActive: boolean
  isPortfolioActive: boolean
  isApproachActive: boolean
  approachStep: number
  isPriceActive: boolean
  isContactActive: boolean
  contactStep: number
  isContactTyping: boolean
  isTechStackActive: boolean
  hoveredTechIndex: number
  isMenuOpenState: Ref<boolean>
  currentCurrencyIndex: number
  isFirstLoad: boolean
  priceOptions: PriceOption[]
  totalPrice: number
}

export function useOrganicState() {
  const nuxtApp = useNuxtApp()

  if (!nuxtApp._organicCoreState) {
    nuxtApp._organicCoreState = {
      shapes: shallowReactive([] as ShapeState[]),
      nextShapeId: 1,
      stateConfig: {
        tension: 1,
        noiseAmp: 30,
        noiseSpeed: 1,
        morphWeight: 0,
        gooBlur: 15,
        alphaMult: 25,
        alphaAdd: -10,
        pulseWeight: 0,
        pulseType: 'sharp',
        xOffset: 0,
        preloaderProgress: 0,
        fillProgress: 0
      },
      isPreloading: ref(true),
      isAboutActive: false,
      isPortfolioActive: false,
      isApproachActive: false,
      approachStep: 0,
      isPriceActive: false,
      isContactActive: false,
      contactStep: 1,
      isContactTyping: false,
      isTechStackActive: false,
      hoveredTechIndex: -1,
      isMenuOpenState: ref(false),
      currentCurrencyIndex: 0,
      isFirstLoad: true,
      priceOptions: [],
      totalPrice: 0
    }
  }

  return nuxtApp._organicCoreState as OrganicCoreState
}
