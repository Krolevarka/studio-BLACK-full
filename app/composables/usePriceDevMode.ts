import { computed } from 'vue'
import gsap from 'gsap'
import { useState } from '#imports'
import { useOrganicCore } from '~/composables/useOrganicCore'

export type DevModeType = 'ai' | 'manual'

export function usePriceDevMode() {
  const priceDevMode = useState<DevModeType>('priceDevMode', () => 'ai')

  const isAiMode = computed(() => priceDevMode.value === 'ai')

  const getEffectivePrice = (basePrice: number): number => {
    if (priceDevMode.value === 'ai') {
      return Math.round(basePrice * 0.70)
    }
    return basePrice
  }

  const triggerPulseEffect = () => {
    const { stateConfig } = useOrganicCore()
    gsap.killTweensOf(stateConfig, 'pulseWeight')
    gsap.fromTo(
      stateConfig,
      { pulseWeight: 1.2 },
      {
        pulseWeight: 0,
        duration: 1.3,
        ease: 'power2.out'
      }
    )
  }

  const setMode = (newMode: DevModeType) => {
    if (priceDevMode.value !== newMode) {
      priceDevMode.value = newMode
      triggerPulseEffect()
    }
  }

  return {
    priceDevMode,
    isAiMode,
    getEffectivePrice,
    triggerPulseEffect,
    setMode
  }
}
