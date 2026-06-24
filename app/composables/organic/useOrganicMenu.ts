import gsap from 'gsap'
import { useOrganicState } from './useOrganicState'
import { useOrganicSync } from './useOrganicSync'

export function useOrganicMenu() {
  const s = useOrganicState()
  const { syncShapes, getCurrentTargetState, clearSync } = useOrganicSync()

  const expandForMenu = (wrapperRef: HTMLElement | null, menuBlobRef?: HTMLElement | null) => {
    s.isMenuOpenState = true

    clearSync()
    gsap.killTweensOf(s.stateConfig)

    s.shapes.forEach(shape => {
      if (shape.pointsTween) {
        shape.pointsTween.kill()
      }
      gsap.killTweensOf(shape)
      shape.points.forEach((p) => {
        gsap.killTweensOf(p)
      })
    })

    if (wrapperRef) gsap.to(wrapperRef, { x: 0, y: 0, duration: 1.2, ease: 'expo.inOut', overwrite: 'auto' })
    if (menuBlobRef) gsap.to(menuBlobRef, { scale: 1, duration: 1.2, ease: 'expo.inOut', overwrite: 'auto' })

    gsap.to(s.stateConfig, {
      tension: 1, noiseAmp: 80, gooBlur: 20, alphaMult: 25, alphaAdd: -10, xOffset: 0,
      duration: 1.2, ease: 'expo.inOut', overwrite: 'auto'
    })
    
    gsap.to(s.stateConfig, {
      pulseWeight: 0,
      duration: 0.2,
      ease: 'power2.out',
      overwrite: 'auto'
    })
    
    const targetRadius = window.innerWidth * 1.5
    s.shapes.forEach(shape => {
      gsap.to(shape, { xOffset: 0, yOffset: 0, scale: 1, rotation: 0, duration: 1.2, ease: 'expo.inOut', overwrite: 'auto' })
      shape.points.forEach((p, index) => {
        const circleAngle = (index / shape.points.length) * Math.PI * 2
        gsap.to(p, {
          x: Math.cos(circleAngle) * targetRadius,
          y: Math.sin(circleAngle) * targetRadius,
          angle: circleAngle,
          duration: 1.2,
          ease: 'expo.inOut',
          overwrite: 'auto'
        })
      })
    })
  }

  const collapseFromMenu = (menuBlobRef?: HTMLElement | null) => {
    s.isMenuOpenState = false
    if (menuBlobRef) gsap.to(menuBlobRef, { scale: 0, duration: 1.2, ease: 'expo.inOut' })
    
    const targetState = getCurrentTargetState()
    const targetPulseWeight = targetState.config.pulseWeight
    
    // Временно обнуляем pulseWeight для основной синхронизации (чтобы сфера схлопывалась гладко)
    targetState.config.pulseWeight = 0
    syncShapes(targetState, 1.2)
    
    // Плавно включаем пульс только когда сфера почти схлопнулась
    if (targetPulseWeight !== undefined && targetPulseWeight > 0) {
      gsap.to(s.stateConfig, {
        pulseWeight: targetPulseWeight,
        duration: 0.6,
        delay: 1.0, // Ждём 1 секунду из 1.2
        ease: 'power2.inOut',
        overwrite: 'auto'
      })
    }
  }

  return {
    expandForMenu,
    collapseFromMenu
  }
}
