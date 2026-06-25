import { onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'
import { getTargetState } from '~/utils/organicStates'
import type { TargetStateConfig, PriceOption } from '~/types/organic'
import { useOrganicState } from './useOrganicState'
import { ANIMATION_TIMINGS } from '~/utils/animation.config'

let optimalShiftWorker: Worker | null = null;
let msgId = 0;
const workerCallbacks = new Map<number, { resolve: (offset: number) => void, timeoutId: ReturnType<typeof setTimeout> }>();

const getWorker = () => {
  if (import.meta.server) return null;
  if (!optimalShiftWorker) {
    optimalShiftWorker = new Worker(new URL('../../utils/optimalShift.worker.ts', import.meta.url), { type: 'module' });
    optimalShiftWorker.onmessage = (e) => {
      const { id, bestOffset } = e.data;
      if (workerCallbacks.has(id)) {
        const { resolve, timeoutId } = workerCallbacks.get(id)!;
        clearTimeout(timeoutId);
        resolve(bestOffset);
        workerCallbacks.delete(id);
      }
    };
    
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        optimalShiftWorker?.terminate();
        optimalShiftWorker = null;
      });
    }
  }
  return optimalShiftWorker;
};

export function useOrganicSync() {
  const s = useOrganicState()
  const { on } = useEventBus()

  let syncTimeout: ReturnType<typeof setTimeout> | null = null
  let pulseTypeDelayedCall: gsap.core.Tween | null = null
  let resizeDebounceTimeout: ReturnType<typeof setTimeout> | null = null

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
    if (resizeDebounceTimeout) {
      clearTimeout(resizeDebounceTimeout)
      resizeDebounceTimeout = null
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
      let isNewShape = false;
      if (!shape) {
        isNewShape = true;
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

        const delay = (isNewShape || shape.scale < 0.1)
          ? duration * 0.52 + Math.random() * 0.35
          : Math.random() * 1.5;

        shape.pulseTl = gsap.timeline({ repeat: -1, delay })
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
      
      const applyInterpolation = (bestOffset: number) => {
        // Сохраняем неискаженные целевые точки для будущих прерываний
        shape.targetPoints = targetShape.points;

        const alignedTargetPoints = new Array(n);
        for (let j = 0; j < n; j++) {
          alignedTargetPoints[j] = targetShape.points[(j + bestOffset) % n]!;
        }

        const progressObj = { val: 0 };
        
        const morphEase = isInterrupted ? 'power2.out' : currentEase;

        shape.pointsTween = gsap.to(progressObj, {
          val: 1,
          duration,
          ease: morphEase,
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
      };

      if (isNewShape || isInterrupted) {
        applyInterpolation(0);
      } else {
        const getBestOffsetAsync = async (): Promise<number> => {
          const worker = getWorker();
          if (!worker) return 0; // Fallback
          return new Promise(resolve => {
            const id = ++msgId;
            const timeoutId = setTimeout(() => {
              if (workerCallbacks.has(id)) {
                workerCallbacks.delete(id);
                resolve(0); // Fallback to 0 if worker times out
              }
            }, 5000);
            workerCallbacks.set(id, { resolve, timeoutId });
            const refPts = referencePoints.map(p => ({ x: p.x, y: p.y }));
            const tgtPts = targetShape.points.map(p => ({ x: p.x, y: p.y }));
            worker.postMessage({ id, referencePoints: refPts, targetPoints: tgtPts });
          });
        };

        getBestOffsetAsync().then(applyInterpolation);
      }
    })

    const mainTarget = target.shapes[0];
    const targetX = mainTarget ? mainTarget.xOffset : 0;
    const targetY = mainTarget ? mainTarget.yOffset : 0;

    for (let i = target.shapes.length; i < s.shapes.length; i++) {
      let shape = s.shapes[i]
      if (!shape) continue
      shape.active = false

      if (shape.pulseTl) {
        shape.pulseTl.kill()
        shape.pulseTl = undefined
      }
      if (shape.pointsTween) {
        shape.pointsTween.kill()
      }

      gsap.to(shape, {
        scale: 0,
        xOffset: targetX,
        yOffset: targetY,
        pulseOffsetX: 0,
        pulseOffsetY: 0,
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

    const handleWindowResize = () => {
      if (resizeDebounceTimeout) clearTimeout(resizeDebounceTimeout)
      resizeDebounceTimeout = setTimeout(() => {
        scheduleSync(0.35, 'power2.out')
      }, 100)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleWindowResize)
    }
    
    onBeforeUnmount(() => {
      clearTimeout(firstLoadTimeout)
      if (syncTimeout) clearTimeout(syncTimeout)
      if (resizeDebounceTimeout) clearTimeout(resizeDebounceTimeout)
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleWindowResize)
      }
    })

    on('about-state', (isActive: boolean) => {
      s.isAboutActive = isActive
      if (s.isMenuOpenState) {
        s.isFirstLoad = false
        return
      }
      const duration = s.isFirstLoad ? ANIMATION_TIMINGS.sync.aboutActiveFirstLoad : ANIMATION_TIMINGS.sync.aboutActive
      s.isFirstLoad = false
      scheduleSync(duration)
    })

    on('portfolio-state', (isActive: boolean) => {
      s.isPortfolioActive = isActive
      if (s.isMenuOpenState) return
      scheduleSync(ANIMATION_TIMINGS.sync.portfolioActive)
    })

    on('approach-state', (payload: { active: boolean; step: number }) => {
      s.isApproachActive = payload.active
      s.approachStep = payload.step || 0
      if (s.isMenuOpenState) return
      scheduleSync(ANIMATION_TIMINGS.sync.approachActive)
    })

    on('price-state', (isActive: boolean) => {
      s.isPriceActive = isActive
      if (s.isMenuOpenState) return
      
      if (!isActive) {
        scheduleSync(ANIMATION_TIMINGS.sync.priceInactive)
      }
    })

    on('price-update', (payload: { active: boolean, options: PriceOption[], totalPrice: number }) => {
      s.isPriceActive = payload.active
      s.priceOptions = payload.options
      s.totalPrice = payload.totalPrice
      
      if (s.isMenuOpenState) return
      scheduleSync(ANIMATION_TIMINGS.sync.priceUpdate)
    })

    on('contact-state', (payload: { active: boolean; step: number; typing: boolean }) => {
      s.isContactActive = payload.active
      s.contactStep = payload.step || 1
      s.isContactTyping = payload.typing || false
      if (s.isMenuOpenState) return
      scheduleSync(ANIMATION_TIMINGS.sync.contactActive)
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
      
      if (s.isMenuOpenState) return;
      
      if (wasActive && payload.active) {
        // Локальное переключение (hover)
        const duration = s.hoveredTechIndex === -1 ? ANIMATION_TIMINGS.sync.techStackClick : ANIMATION_TIMINGS.sync.techStackHover;
        const ease = 'power2.out';
        scheduleSync(duration, ease)
      } else {
        // Переход между вкладками
        scheduleSync(ANIMATION_TIMINGS.sync.techStackTab, 'power3.inOut')
      }
    })

    on('price-drag', (payload: { id: string, x: number, y: number }) => {
      updateShapeOffset(payload.id, payload.x, payload.y)
    })
  }

  const destroyOrganicCore = () => {
    optimalShiftWorker?.terminate();
    optimalShiftWorker = null;
  }

  return {
    getCurrentTargetState,
    scheduleSync,
    clearSync,
    syncShapes,
    updateShapeOffset,
    initOrganicCore,
    destroyOrganicCore
  }
}
