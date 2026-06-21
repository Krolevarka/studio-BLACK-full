import type { ComputedRef } from 'vue'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface DeviceContext {
  deviceType: ComputedRef<DeviceType>
  isMobileOrTablet: ComputedRef<boolean>
  isDesktopDevice: ComputedRef<boolean>
  needsHeavyAnimations: ComputedRef<boolean>
  needsCursor: ComputedRef<boolean>
  needsHoverEffects: ComputedRef<boolean>
}
