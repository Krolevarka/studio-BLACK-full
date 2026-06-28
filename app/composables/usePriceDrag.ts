import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue'
import gsap from 'gsap'
import { useState } from '#imports'
import type { PriceOption } from '~/types/organic'
import type { PhysicsState } from '~/types/price'
import { useEventBus } from '~/composables/useEventBus'
import { usePriceCollision } from './price/usePriceCollision'
import { usePricePhysics } from './price/usePricePhysics'
import { usePriceDragGesture } from './price/usePriceDragGesture'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { SECTION } from '~/utils/sectionLabels'

export function usePriceDrag(
  options: Ref<PriceOption[]>,
  isMobile: Ref<boolean>,
  updateOrganic: () => void,
  emit: ReturnType<typeof useEventBus>['emit'],
  hintState: Ref<'initial' | 'remove' | 'hidden'>
) {
  const hoveredOptId = ref<string | null>(null)
  const isHeavyDrag = useState('isHeavyDrag', () => false)
  
  const optionRefs = new Map<string, HTMLElement>()
  const physicsMap = new Map<string, PhysicsState>()
  const startOffset = { x: 0, y: 0 }

  const hoverOption = (id: string | null) => {
    if (!isMobile.value && !isHeavyDrag.value) {
      hoveredOptId.value = id
    }
  }

  const { updateObstaclesCache } = usePriceCollision(options, isMobile)
  const { isMenuOpenLocal } = useMenuVisibility()
  
  const { registerOptionRef, tick, getOptionOrbitPos, getOrbitScale } = usePricePhysics(
    options, isMobile, emit, optionRefs, physicsMap, startOffset, isMenuOpenLocal
  )

  const { startDrag: _startDrag, cleanupGestures } = usePriceDragGesture(
    options, isMobile, updateOrganic, physicsMap, startOffset, getOptionOrbitPos, getOrbitScale
  )

  const startDrag = (opt: PriceOption, e: PointerEvent) => {
    updateObstaclesCache()
    _startDrag(opt, e, hoveredOptId)
  }

  const { on, off } = useEventBus()
  let isTickerActive = false

  const handleSectionChange = (label: string) => {
    if (label === SECTION.PRICE) {
      updateObstaclesCache()
      if (!isTickerActive) {
        gsap.ticker.add(tick)
        isTickerActive = true
      }
    } else {
      if (isTickerActive) {
        gsap.ticker.remove(tick)
        isTickerActive = false
      }
    }
  }

  onMounted(() => {
    updateObstaclesCache()
    window.addEventListener('resize', updateObstaclesCache)
    on('section-change', handleSectionChange)
  })

  onBeforeUnmount(() => {
    cleanupGestures()
    window.removeEventListener('resize', updateObstaclesCache)
    if (isTickerActive) gsap.ticker.remove(tick)
    off('section-change', handleSectionChange)
    physicsMap.forEach(p => gsap.killTweensOf(p))
  })

  const unselectLast = () => {
    const selectedOpts = options.value.filter(o => o.selected);
    if (selectedOpts.length > 0) {
      const optToUnselect = selectedOpts[selectedOpts.length - 1];
      if (optToUnselect) {
        optToUnselect.selected = false;
        updateOrganic();
        hintState.value = 'hidden';
      }
    }
  }

  const submitProject = () => {
    emit('nav-goto', '#contact')
  }

  return {
    hoveredOptId,
    hoverOption,
    startDrag,
    registerOptionRef,
    unselectLast,
    submitProject
  }
}
