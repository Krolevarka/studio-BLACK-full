import { onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'
import { getTargetState } from '~/utils/organicStates'
import type { TargetStateConfig, PriceOption } from '~/types/organic'
import { useOrganicState } from './useOrganicState'

export function useOrganicSync() {
  const s = useOrganicState()
  const { on } = useEventBus()

  let syncTimeout: ReturnType<typeof setTimeout> | null = null
  let pulseTypeDelayedCall: gsap.core.Tween | null = null

  const getCurrentTargetState = () => {
    return getTargetState({
      w: window.innerWidth,
      h: window.innerHeight,
      isMobile: window.innerWidth < 768,
      isPriceActive: s.isPriceActive,
      isApproachActive: s.isApproachActive,
      approachStep: s.approachStep,
      isPortfolioActive: s.isPortfolioActive,
      isAboutActive: s.isAboutActive,
      currentCurrencyIndex: s.currentCurrencyIndex,
      priceOptions: s.priceOptions,
      totalPrice: s.totalPrice,
      isContactActive: s.isContactActive,
      contactStep: s.contactStep,
      isContactTyping: s.isContactTyping,
      isTechStackActive: s.isTechStackActive,
      hoveredTechIndex: s.hoveredTechIndex
    })
  }

  const scheduleSync = (duration: number, ease?: string) => {
    if (syncTimeout) clearTimeout(syncTimeout)
    syncTimeout = setTimeout(() => {
      syncShapes(getCurrentTargetState(), duration, ease)
    }, 10)
  }

  const clearSync = () => {
    if (syncTimeout) {
      clearTimeout(syncTimeout)
      syncTimeout = null
    }
    if (pulseTypeDelayedCall) {
      pulseTypeDelayedCall.kill()
      pulseTypeDelayedCall = null
    }
  }

  const syncShapes = (target: TargetStateConfig, defaultDuration: number, defaultEase?: string) => {
    const targetConfig = { ...target.config }
    const duration = targetConfig.duration ?? defaultDuration;
    const currentEase = targetConfig.ease ?? defaultEase ?? 'power3.inOut';

    if (target.config.pulseType && target.config.pulseType !== s.stateConfig.pulseType) {
      if (pulseTypeDelayedCall) {
        pulseTypeDelayedCall.kill()
        pulseTypeDelayedCall = null
      }
      if (s.stateConfig.pulseWeight > 0.05 && targetConfig.pulseWeight === 0) {
        pulseTypeDelayedCall = gsap.delayedCall(duration * 0.8, () => {
          s.stateConfig.pulseType = target.config.pulseType!;
        });
      } else {
        s.stateConfig.pulseType = target.config.pulseType;
      }
    }

    // Исключаем строковые свойства через деструктуризацию перед gsap.to
    const { pulseType: _p, duration: _d, ease: _e, ...gsapConfig } = targetConfig;

    gsap.to(s.stateConfig, { ...gsapConfig, duration, ease: currentEase, overwrite: 'auto' })

    target.shapes.forEach((targetShape, i) => {
      let shape = s.shapes.find(sh => sh.id === targetShape.id) || s.shapes[i]
      if (!shape) {
        const parentShape = s.shapes.find(sh => sh.id === 'core') || s.shapes[0] || { xOffset: 0, yOffset: 0 }
        const initialPoints = targetShape.points.map((p) => ({ ...p }))
        shape = { 
          id: targetShape.id || s.nextShapeId++, 
          points: initialPoints, 
          xOffset: parentShape.xOffset, 
          yOffset: parentShape.yOffset, 
          scale: 0, 
          rotation: targetShape.rotation, 
          active: true,
          pulseOffsetX: 0,
          pulseOffsetY: 0,
          noisePhaseOffset: Math.random() * 1000,
          noiseMult: targetShape.noiseMult ?? 1,
          isHole: targetShape.isHole || false
        }
        s.shapes.push(shape)
      } else if (targetShape.id !== undefined) {
        shape.id = targetShape.id;
      }
      
      shape.isHole = targetShape.isHole || false;

      if (shape.pulseTl) {
        shape.pulseTl.kill()
        shape.pulseTl = undefined
      }

      shape.active = true
      
      gsap.to(shape, {
        xOffset: targetShape.xOffset,
        yOffset: targetShape.yOffset,
        scale: targetShape.scale,
        rotation: targetShape.rotation,
        noiseMult: targetShape.noiseMult ?? 1,
        duration,
        ease: 'power3.inOut',
        overwrite: 'auto'
      })

      if (targetShape.pulseX || targetShape.pulseY) {
        const outDur = 0.6 + Math.random() * 0.8; 
        const waitOut = Math.random() * 0.4;      
        const inDur = 0.6 + Math.random() * 0.8;  
        const waitIn = 0.2 + Math.random() * 0.8; 

        shape.pulseTl = gsap.timeline({ repeat: -1, delay: Math.random() * 1.5 })
        shape.pulseTl
          .to(shape, { pulseOffsetX: targetShape.pulseX, pulseOffsetY: targetShape.pulseY, duration: outDur, ease: 'power2.out' })
          .to(shape, { duration: waitOut, pulseOffsetX: targetShape.pulseX, pulseOffsetY: targetShape.pulseY, ease: 'none' })
          .to(shape, { pulseOffsetX: 0, pulseOffsetY: 0, duration: inDur, ease: 'power2.in' })
          .to(shape, { duration: waitIn, pulseOffsetX: 0, pulseOffsetY: 0, ease: 'none' })
      } else {
        gsap.to(shape, { pulseOffsetX: 0, pulseOffsetY: 0, duration, ease: 'power3.inOut', overwrite: 'auto' })
      }
      
      const isInterrupted = shape.pointsTween && shape.pointsTween.isActive()
      if (shape.pointsTween) {
        shape.pointsTween.kill()
      }

      const startPoints = shape.points.map((p) => ({ x: p.x, y: p.y, angle: p.angle, normal: { x: p.normal.x, y: p.normal.y } }))
      
      const referencePoints = shape.targetPoints || startPoints;
      
      const n = startPoints.length;
      let bestOffset = 0;
      let minTotalDist = Infinity;
      
      // АЛГОРИТМ ОПТИМАЛЬНОГО СДВИГА (Optimal Shift)
      for (let offset = 0; offset < n; offset++) {
        let totalDist = 0;
        for (let i = 0; i < n; i++) {
          const sp = referencePoints[i]!;
          const tp = targetShape.points[(i + offset) % n]!;
          const dx = tp.x - sp.x;
          const dy = tp.y - sp.y;
          totalDist += dx * dx + dy * dy;
        }
        if (totalDist < minTotalDist) {
          minTotalDist = totalDist;
          bestOffset = offset;
        }
      }

      // Сохраняем неискаженные целевые точки для будущих прерываний
      shape.targetPoints = targetShape.points;

      const alignedTargetPoints = new Array(n);
      for (let i = 0; i < n; i++) {
        alignedTargetPoints[i] = targetShape.points[(i + bestOffset) % n]!;
      }

      const progressObj = { val: 0 };
      
      shape.pointsTween = gsap.to(progressObj, {
        val: 1,
        duration,
        ease: currentEase,
        onUpdate: () => {
          shape!.points.forEach((p, j) => {
            const sp = startPoints[j]
            const tp = alignedTargetPoints[j]
            if (!tp || !sp) return
            const t = progressObj.val
            
            // ЧИСТАЯ ЛИНЕЙНАЯ ИНТЕРПОЛЯЦИЯ с уже оптимизированным (ближайшим) маппингом
            p.x = sp.x + (tp.x - sp.x) * t;
            p.y = sp.y + (tp.y - sp.y) * t;
            
            let dAngle = tp.angle - sp.angle
            if (dAngle > Math.PI) dAngle -= 2 * Math.PI
            if (dAngle < -Math.PI) dAngle += 2 * Math.PI
            p.angle = sp.angle + dAngle * t
            
            p.normal.x = sp.normal.x + (tp.normal.x - sp.normal.x) * t
            p.normal.y = sp.normal.y + (tp.normal.y - sp.normal.y) * t
          })
        }
      })
    })

    for (let i = target.shapes.length; i < s.shapes.length; i++) {
      let shape = s.shapes[i]
      if (!shape) continue
      shape.active = false
      const firstTarget = target.shapes[0]
      gsap.to(shape, {
        scale: 0,
        xOffset: firstTarget ? firstTarget.xOffset : 0,
        yOffset: firstTarget ? firstTarget.yOffset : 0,
        duration,
        ease: 'power3.inOut',
        overwrite: 'auto',
        onComplete: () => {
          if (!shape.active) {
            const idx = s.shapes.indexOf(shape)
            if (idx > -1) s.shapes.splice(idx, 1)
          }
        }
      })
    }
  }

  const updateShapeOffset = (id: string, x: number, y: number) => {
    const shape = s.shapes.find(sh => sh.id === id)
    if (shape) {
      gsap.killTweensOf(shape, 'xOffset,yOffset')
      // Используем прямое присвоение вместо gsap.set для мгновенного обновления Proxy
      shape.xOffset = x
      shape.yOffset = y
    }
  }

  const initOrganicCore = () => {
    const initialTarget = getCurrentTargetState()
    const initialShape = initialTarget.shapes[0]!
    s.shapes.push({
      id: s.nextShapeId++,
      points: initialShape.points.map((p) => ({ ...p })),
      xOffset: initialShape.xOffset,
      yOffset: initialShape.yOffset,
      scale: initialShape.scale,
      rotation: initialShape.rotation,
      active: true,
      pulseOffsetX: 0,
      pulseOffsetY: 0,
      noisePhaseOffset: 0,
      noiseMult: 1
    })
    Object.assign(s.stateConfig, initialTarget.config)

    const firstLoadTimeout = setTimeout(() => { s.isFirstLoad = false }, 100)
    
    onBeforeUnmount(() => {
      clearTimeout(firstLoadTimeout)
      if (syncTimeout) clearTimeout(syncTimeout)
    })

    on('about-state', (isActive: boolean) => {
      s.isAboutActive = isActive
      if (s.isMenuOpenState.value) {
        s.isFirstLoad = false
        return
      }
      const duration = s.isFirstLoad ? 0 : 0.4
      s.isFirstLoad = false
      scheduleSync(duration)
    })

    on('portfolio-state', (isActive: boolean) => {
      s.isPortfolioActive = isActive
      if (s.isMenuOpenState.value) return
      scheduleSync(0.4)
    })

    on('approach-state', (payload: { active: boolean; step: number }) => {
      s.isApproachActive = payload.active
      s.approachStep = payload.step || 0
      if (s.isMenuOpenState.value) return
      scheduleSync(3.4)
    })

    on('price-state', (isActive: boolean) => {
      s.isPriceActive = isActive
      if (s.isMenuOpenState.value) return
      
      if (!isActive) {
        scheduleSync(2.8)
      }
    })

    on('price-update', (payload: { active: boolean, options: PriceOption[], totalPrice: number }) => {
      s.isPriceActive = payload.active
      s.priceOptions = payload.options
      s.totalPrice = payload.totalPrice
      
      if (s.isMenuOpenState.value) return
      scheduleSync(2.4)
    })

    on('contact-state', (payload: { active: boolean; step: number; typing: boolean }) => {
      s.isContactActive = payload.active
      s.contactStep = payload.step || 1
      s.isContactTyping = payload.typing || false
      if (s.isMenuOpenState.value) return
      scheduleSync(2.4)
    })

    on('techstack-state', (payload: { active: boolean; hoveredIndex?: number }) => {
      const wasActive = s.isTechStackActive;
      const newHoveredIndex = payload.hoveredIndex !== undefined ? payload.hoveredIndex : -1;

      // Если состояние не изменилось (например, дублирующее событие из onMounted), игнорируем
      if (wasActive === payload.active && s.hoveredTechIndex === newHoveredIndex) {
        return;
      }

      s.isTechStackActive = payload.active;
      s.hoveredTechIndex = newHoveredIndex;
      
      if (s.isMenuOpenState.value) return;
      
      if (wasActive && payload.active) {
        // Локальное переключение (hover)
        const duration = s.hoveredTechIndex === -1 ? 0.4 : 0.6;
        const ease = s.hoveredTechIndex === -1 ? 'power2.out' : 'power2.out';
        scheduleSync(duration, ease)
      } else {
        // Переход между вкладками
        scheduleSync(1.5, 'power3.inOut')
      }
    })

    on('price-drag', (payload: { id: string, x: number, y: number }) => {
      updateShapeOffset(payload.id, payload.x, payload.y)
    })
  }

  return {
    getCurrentTargetState,
    scheduleSync,
    clearSync,
    syncShapes,
    updateShapeOffset,
    initOrganicCore
  }
}
