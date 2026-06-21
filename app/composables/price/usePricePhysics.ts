import { type Ref } from 'vue'
import gsap from 'gsap'
import { useState } from '#imports'
import type { PriceOption } from '~/types/organic'
import type { PhysicsState } from '~/types/price'
import { usePriceCollision } from './usePriceCollision'
import { useEventBus } from '~/composables/useEventBus'

export function usePricePhysics(
  options: Ref<PriceOption[]>,
  isMobile: Ref<boolean>,
  emit: ReturnType<typeof useEventBus>['emit'],
  optionRefs: Map<string, HTMLElement>,
  physicsMap: Map<string, PhysicsState>,
  startOffset: { x: number, y: number }
) {
  const cursorData = useState('cursorData', () => ({ x: 0, y: 0, smoothedX: 0, smoothedY: 0, weight: 1.0 }))
  const { checkCollision } = usePriceCollision(options, isMobile)

  const getOptionOrbitPos = (opt: PriceOption) => {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const remScale = Math.max(10 / 16, Math.min(24 / 16, window.innerWidth / 1920));
    
    const orbitDistance = isMobile.value 
      ? Math.min(200, minDim * 0.28) + opt.radiusOffset * 0.5
      : (310 + opt.radiusOffset) * remScale;
    return {
      x: Math.cos(opt.angle) * orbitDistance,
      y: Math.sin(opt.angle) * orbitDistance
    };
  }

  const registerOptionRef = (id: string, el: HTMLElement | null) => {
    if (el) {
      optionRefs.set(id, el)
      if (!physicsMap.has(id)) {
        physicsMap.set(id, {
          x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0,
          scaleX: 1, scaleY: 1, angle: 0, isDragging: false, isTextHidden: false
        })
      }
    } else {
      optionRefs.delete(id)
      physicsMap.delete(id)
    }
  }

  const tick = () => {
    if (!options.value.length) return

    options.value.forEach(opt => {
      const el = optionRefs.get(opt.id)
      const pState = physicsMap.get(opt.id)
      if (!pState || !el || opt.selected) return

      if (pState.isDragging) {
        const nextX = cursorData.value.smoothedX - window.innerWidth / 2 + startOffset.x
        const nextY = cursorData.value.smoothedY - window.innerHeight / 2 + startOffset.y
        
        pState.vx = nextX - pState.x
        pState.vy = nextY - pState.y
        
        pState.x = nextX
        pState.y = nextY

        let collision = checkCollision(pState, el, opt, physicsMap)

        if (pState.isTextHidden !== collision) {
          pState.isTextHidden = collision;
          const contentEl = el.querySelector('.satellite-content') as HTMLElement;
          if (contentEl) {
             contentEl.style.opacity = collision ? '0' : '1';
          }
        }
      } else {
        if (pState.isTextHidden) {
           pState.isTextHidden = false;
           const contentEl = el.querySelector('.satellite-content') as HTMLElement;
           if (contentEl) {
              contentEl.style.opacity = '1';
           }
        }

        const targetPos = getOptionOrbitPos(opt)
        const spring = 0.08
        const friction = 0.75
        pState.vx += (targetPos.x - pState.x) * spring
        pState.vy += (targetPos.y - pState.y) * spring
        
        pState.vx *= friction
        pState.vy *= friction

        pState.x += pState.vx
        pState.y += pState.vy

        pState.lastX = pState.x
        pState.lastY = pState.y
      }

      emit('price-drag', { id: opt.id, x: pState.x, y: pState.y })

      gsap.set(el, {
        x: pState.x,
        y: pState.y,
        xPercent: -50,
        yPercent: -50
      })
    })
  }

  return {
    registerOptionRef,
    getOptionOrbitPos,
    tick
  }
}
