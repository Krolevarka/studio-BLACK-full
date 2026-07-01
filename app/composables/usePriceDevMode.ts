import { computed } from 'vue'
import { useState } from '#imports'

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

  const setMode = (newMode: DevModeType) => {
    if (priceDevMode.value !== newMode) {
      priceDevMode.value = newMode
    }
  }

  return {
    priceDevMode,
    isAiMode,
    getEffectivePrice,
    setMode
  }
}
