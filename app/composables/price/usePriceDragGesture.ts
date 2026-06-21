import { type Ref } from 'vue'
import gsap from 'gsap'
import { useState, useNuxtApp } from '#imports'
import type { PriceOption } from '~/types/organic'
import type { PhysicsState } from '~/types/price'

export function usePriceDragGesture(
  options: Ref<PriceOption[]>,
  isMobile: Ref<boolean>,
  updateOrganic: () => void,
  physicsMap: Map<string, PhysicsState>,
  startOffset: { x: number, y: number },
  getOptionOrbitPos: (opt: PriceOption) => { x: number, y: number }
) {
  const isHeavyDrag = useState('isHeavyDrag', () => false)
  const cursorData = useState('cursorData', () => ({ x: 0, y: 0, smoothedX: 0, smoothedY: 0, weight: 1.0 }))
  
  let activeDragOpt: PriceOption | null = null
  let startPointer = { x: 0, y: 0 }
  
  let lenisInstance: import('#app').NuxtApp['$lenis'] = undefined
  try {
    const { $lenis } = useNuxtApp()
    lenisInstance = $lenis
  } catch (e) {
  }

  const startDrag = (opt: PriceOption, e: PointerEvent, hoveredOptId: Ref<string | null>) => {
    hoveredOptId.value = null
    e.preventDefault()
    e.stopPropagation()

    const isAnimating = useState('isAnimating', () => false)
    if (isAnimating.value) return

    if (isMobile.value) {
      opt.selected = true
      updateOrganic()
      return
    }
    
    activeDragOpt = opt
    const pState = physicsMap.get(opt.id)
    if (pState) {
      pState.isDragging = true
      gsap.killTweensOf(pState) 
    }

    startPointer = { x: e.clientX, y: e.clientY }
    
    const cursorX = cursorData.value.smoothedX - window.innerWidth / 2
    const cursorY = cursorData.value.smoothedY - window.innerHeight / 2
    startOffset.x = pState ? pState.x - cursorX : 0
    startOffset.y = pState ? pState.y - cursorY : 0
    
    isHeavyDrag.value = true
    if (lenisInstance) lenisInstance.stop()
    
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd)
    window.addEventListener('pointercancel', onDragEnd)
  }

  const onDragMove = (e: PointerEvent) => {
    e.preventDefault()
    if (!activeDragOpt) return
  }

  const onDragEnd = (e: PointerEvent) => {
    if (!activeDragOpt) return
    
    const pState = physicsMap.get(activeDragOpt.id)
    
    if (pState) {
      pState.isDragging = false;
      
      const flingX = pState.x + pState.vx * 15;
      const flingY = pState.y + pState.vy * 15;

      const distToCenter = Math.sqrt(flingX * flingX + flingY * flingY)
      
      if (distToCenter < 140) {
        activeDragOpt.selected = true
      } else {
        const targetPos = getOptionOrbitPos(activeDragOpt)
        const dx = pState.x - targetPos.x
        const dy = pState.y - targetPos.y
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
           activeDragOpt.selected = true
        } else {
           activeDragOpt.angle = Math.atan2(flingY, flingX)
           if (isMobile.value) {
              const minDim = Math.min(window.innerWidth, window.innerHeight)
              activeDragOpt.radiusOffset = (distToCenter - Math.min(200, minDim * 0.28)) * 2
           } else {
              activeDragOpt.radiusOffset = distToCenter - 310
           }
        }
      }
    }
    
    isHeavyDrag.value = false
    if (lenisInstance) lenisInstance.start()
    
    updateOrganic()
    activeDragOpt = null
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
    window.removeEventListener('pointercancel', onDragEnd)
  }

  const cleanupGestures = () => {
    isHeavyDrag.value = false
    if (lenisInstance) lenisInstance.start()
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
    window.removeEventListener('pointercancel', onDragEnd)
  }

  return {
    startDrag,
    cleanupGestures
  }
}
