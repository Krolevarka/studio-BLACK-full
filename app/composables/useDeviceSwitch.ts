import { computed } from 'vue'
import { useDevice } from '#imports'
import type { DeviceType, DeviceContext } from '~/types/device'

export function useDeviceSwitch(): DeviceContext {
  const { isMobile, isTablet, isDesktop } = useDevice()

  const deviceType = computed<DeviceType>(() => {
    if (isMobile) return 'mobile'
    if (isTablet) return 'tablet'
    return 'desktop'
  })

  const isMobileOrTablet = computed(() => isMobile || isTablet)
  const isDesktopDevice = computed(() => isDesktop)

  // Флаги для отключения тяжелых эффектов и hover-логики на мобильных
  const needsHeavyAnimations = computed(() => isDesktop)
  const needsCursor = computed(() => isDesktop)
  const needsHoverEffects = computed(() => isDesktop)

  return {
    deviceType,
    isMobileOrTablet,
    isDesktopDevice,
    needsHeavyAnimations,
    needsCursor,
    needsHoverEffects
  }
}
