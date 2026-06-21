import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import gsap from 'gsap'
import { useState } from '#imports'
import { useOrganicCore } from '~/composables/useOrganicCore'
import { useMouseVelocity } from '~/composables/useMouseVelocity'

export function useCursor() {
  const cursorData = useState('cursorData', () => ({ x: 0, y: 0, smoothedX: 0, smoothedY: 0, weight: 1.0 }))
  const isHeavyDrag = useState('isHeavyDrag', () => false)
  const { isPreloading } = useOrganicCore()
  const { startListening, stopListening, getVelocity } = useMouseVelocity()

  const coreRef = ref<HTMLElement | null>(null)
  const trailRef = ref<HTMLElement | null>(null)
  const ringRef = ref<HTMLElement | null>(null)

  let mouseX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  let mouseY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  let coreX = mouseX
  let coreY = mouseY
  let trailX = mouseX
  let trailY = mouseY

  let isMagnetic = false
  let magneticTarget: HTMLElement | null = null
  let magneticRect = { left: 0, top: 0, width: 0, height: 0 }

  let currentAngle = 0
  let currentScaleX = 1
  let currentScaleY = 1

  const state = {
    width: 16,
    height: 16,
    borderRadius: 50,
    popScale: 1,
    coreOpacity: 1,
    ringWidth: 16,
    ringOpacity: 0
  }

  const isHovering = ref(false)
  const isHidden = ref(true)

  let dragTimer: ReturnType<typeof setTimeout> | null = null
  let clickTimer: ReturnType<typeof setTimeout> | null = null

  watch(isHeavyDrag, (isDragging) => {
    if (isDragging) {
      gsap.to(state, {
        width: 16,
        height: 16,
        coreOpacity: 1,
        ringOpacity: 0,
        borderRadius: 50,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      })
    } else {
      if (dragTimer) clearTimeout(dragTimer)
      dragTimer = setTimeout(() => {
        const el = typeof document !== 'undefined' ? document.elementFromPoint(mouseX, mouseY) : null
        if (el) {
          onMouseOverGlobal({ target: el } as unknown as PointerEvent)
        }
      }, 50)
    }
  })

  const onMouseMove = (e: PointerEvent | MouseEvent) => {
    if (document.pointerLockElement) {
      cursorData.value.x += e.movementX * cursorData.value.weight
      cursorData.value.y += e.movementY * cursorData.value.weight
      cursorData.value.x = Math.max(0, Math.min(window.innerWidth, cursorData.value.x))
      cursorData.value.y = Math.max(0, Math.min(window.innerHeight, cursorData.value.y))
    } else {
      cursorData.value.x = e.clientX
      cursorData.value.y = e.clientY
    }

    mouseX = cursorData.value.x
    mouseY = cursorData.value.y

    if (isHidden.value) isHidden.value = false
  }

  const onClickGlobal = () => {
    if (clickTimer) clearTimeout(clickTimer)
    clickTimer = setTimeout(() => {
      if (typeof document !== 'undefined') {
        const el = document.elementFromPoint(mouseX, mouseY)
        if (el) onMouseOverGlobal({ target: el } as unknown as PointerEvent)
      }
    }, 50)
  }

  const onMouseDownGlobal = () => {
    if (isHeavyDrag.value) return
    const isRing = isHovering.value && !isMagnetic
    
    let targetScale = 0.85 // Мягкий клик по фону
    if (isMagnetic) targetScale = 0.95 // Едва заметное нажатие на магнитной кнопке
    else if (isRing) targetScale = 0.9 // Клик по ссылке (кольцо)

    gsap.to(state, {
      popScale: targetScale,
      duration: 0.15,
      ease: 'power2.out',
      overwrite: 'auto'
    })
  }

  const onMouseUpGlobal = () => {
    if (isHeavyDrag.value) return
    gsap.to(state, {
      popScale: 1,
      duration: 0.6,
      ease: 'elastic.out(1.2, 0.4)',
      overwrite: 'auto'
    })
  }

  const onMouseLeave = () => { isHidden.value = true }
  const onMouseEnter = () => { isHidden.value = false }

  const onMouseOverGlobal = (e: PointerEvent | MouseEvent) => {
    if (isHeavyDrag.value) return
    const target = e.target as HTMLElement
    const magnetic = target.closest('.magnetic-btn')
    const clickable = target.closest('a, button, input, textarea, select, label, [class*="cursor-pointer"], [class*="cursor-grab"]')

    if (magnetic) {
      if (isMagnetic && magneticTarget === magnetic) return
      isHovering.value = true
      isMagnetic = true
      magneticTarget = magnetic as HTMLElement

      const rect = magneticTarget.getBoundingClientRect()
      magneticRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height }

      const computedStyle = window.getComputedStyle(magneticTarget)
      const btnRadius = parseFloat(computedStyle.borderRadius) || 0

      gsap.to(state, {
        width: rect.width,
        height: rect.height,
        borderRadius: btnRadius,
        popScale: 1,
        coreOpacity: 1,
        ringOpacity: 0,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto'
      })
    } else if (clickable) {
      if (!isMagnetic && isHovering.value) return
      isHovering.value = true
      isMagnetic = false
      magneticTarget = null

      gsap.to(state, {
        width: 0,
        height: 0,
        coreOpacity: 0,
        ringWidth: 44,
        ringOpacity: 1,
        borderRadius: 50,
        popScale: 1,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto'
      })
    } else {
      const wasMagnetic = isMagnetic

      isHovering.value = false
      isMagnetic = false
      magneticTarget = null

      if (wasMagnetic) {
        gsap.to(state, {
          width: 16,
          height: 16,
          coreOpacity: 1,
          ringOpacity: 0,
          borderRadius: 50,
          duration: 0.25,
          ease: 'expo.out',
          overwrite: 'auto'
        })

        state.popScale = 0.4
        gsap.to(state, {
          popScale: 1,
          duration: 0.8,
          ease: 'elastic.out(1.2, 0.4)',
          overwrite: 'auto'
        })
      } else {
        gsap.to(state, {
          width: 16,
          height: 16,
          coreOpacity: 1,
          ringWidth: 16,
          ringOpacity: 0,
          borderRadius: 50,
          popScale: 1,
          duration: 0.5,
          ease: 'power3.out',
          overwrite: 'auto'
        })
      }
    }
  }

  const render = () => {
    const { vx, vy, speed } = getVelocity()

    let targetX = mouseX
    let targetY = mouseY

    if (isMagnetic && magneticTarget) {
      const centerX = magneticRect.left + magneticRect.width / 2
      const centerY = magneticRect.top + magneticRect.height / 2

      targetX = centerX
      targetY = centerY

      state.width += (magneticRect.width - state.width) * 0.2
      state.height += (magneticRect.height - state.height) * 0.2
    }

    const coreEase = isHeavyDrag.value ? 0.05 : (isMagnetic ? 0.15 : 0.6)
    const trailEase = isHeavyDrag.value ? 0.03 : (isMagnetic ? 0.1 : 0.25)

    coreX += (targetX - coreX) * coreEase
    coreY += (targetY - coreY) * coreEase

    cursorData.value.smoothedX = coreX
    cursorData.value.smoothedY = coreY

    trailX += (coreX - trailX) * trailEase
    trailY += (coreY - trailY) * trailEase

    if ((!isMagnetic && state.width > 24) || isHeavyDrag.value) {
      trailX = coreX
      trailY = coreY
    }

    let targetAngle = 0
    let targetScaleX = 1
    let targetScaleY = 1

    if (isMagnetic) {
      targetAngle = 0
      targetScaleX = 1
      targetScaleY = 1
    } else if (!isHeavyDrag.value && speed > 0.5 && state.width <= 24) {
      targetAngle = Math.atan2(vy, vx)
      const maxStretch = 2.0
      const stretch = Math.min(speed / 20, maxStretch)
      targetScaleX = 1 + stretch
      targetScaleY = Math.max(0.4, 1 - stretch * 0.2)
    } else {
      targetAngle = currentAngle
    }

    let diff = targetAngle - currentAngle

    // Normalize diff to [-PI/2, PI/2] because an ellipse is symmetrical.
    // This prevents the cursor from rotating completely through 90deg (vertical) 
    // when you suddenly reverse direction (e.g. left to right).
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    if (diff > Math.PI / 2) diff -= Math.PI;
    else if (diff < -Math.PI / 2) diff += Math.PI;

    currentAngle += diff * 0.4
    currentScaleX += (targetScaleX - currentScaleX) * 0.2
    currentScaleY += (targetScaleY - currentScaleY) * 0.2

    // Fade out rotation and stretch smoothly as the blob expands into a button
    const deformationFactor = Math.max(0, Math.min(1, 1 - (state.width - 16) / 8))

    const stretchX = currentScaleX - 1
    const stretchY = currentScaleY - 1
    const finalScaleX = (1 + stretchX * deformationFactor) * state.popScale
    const finalScaleY = (1 + stretchY * deformationFactor) * state.popScale

    const isAnimating = Math.abs(coreX - targetX) > 0.1 || Math.abs(coreY - targetY) > 0.1 || speed > 0.5 || Math.abs(targetScaleX - currentScaleX) > 0.01 || Math.abs(targetScaleY - currentScaleY) > 0.01 || state.width > 16 || state.height > 16
    const willChangeVal = isAnimating ? 'transform, width, height, opacity' : 'auto'

    // Normalize angle to avoid spinning, then scale it by deformation factor
    const shortestToZero = Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle))
    const displayAngle = shortestToZero * deformationFactor

    if (coreRef.value) {
      coreRef.value.style.transform = `translate3d(calc(${coreX}px - 50%), calc(${coreY}px - 50%), 0) rotate(${displayAngle}rad) scale(${finalScaleX}, ${finalScaleY})`
      coreRef.value.style.width = `${Math.max(0, state.width)}px`
      coreRef.value.style.height = `${Math.max(0, state.height)}px`
      coreRef.value.style.borderRadius = `${state.borderRadius}px`
      coreRef.value.style.opacity = `${state.coreOpacity}`
      coreRef.value.style.willChange = willChangeVal
    }

    if (trailRef.value) {
      trailRef.value.style.transform = `translate3d(calc(${trailX}px - 50%), calc(${trailY}px - 50%), 0)`
      trailRef.value.style.width = `${Math.max(0, state.width * 0.6)}px`
      trailRef.value.style.height = `${Math.max(0, state.height * 0.6)}px`
      trailRef.value.style.borderRadius = `${state.borderRadius}px`
      trailRef.value.style.opacity = `${state.coreOpacity}`
      trailRef.value.style.willChange = willChangeVal
    }

    if (ringRef.value) {
      ringRef.value.style.transform = `translate3d(calc(${coreX}px - 50%), calc(${coreY}px - 50%), 0) scale(${state.popScale})`
      ringRef.value.style.width = `${state.ringWidth}px`
      ringRef.value.style.height = `${state.ringWidth}px`
      ringRef.value.style.opacity = `${state.ringOpacity}`
      ringRef.value.style.willChange = willChangeVal
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        startListening()

        window.addEventListener('pointermove', onMouseMove, { passive: true })

        document.addEventListener('pointerleave', onMouseLeave)
        document.addEventListener('pointerenter', onMouseEnter)
        document.addEventListener('pointerover', onMouseOverGlobal)

        // Re-evaluate cursor target on click, in case the clicked element disappears or loses pointer events
        document.addEventListener('click', onClickGlobal)
        document.addEventListener('pointerdown', onMouseDownGlobal)
        document.addEventListener('pointerup', onMouseUpGlobal)

        document.body.classList.add('custom-cursor-enabled')

        gsap.ticker.add(render, false, false)
      }
    }
  })

  onBeforeUnmount(() => {
    if (dragTimer) clearTimeout(dragTimer)
    if (clickTimer) clearTimeout(clickTimer)
    stopListening()
    window.removeEventListener('pointermove', onMouseMove)
    document.removeEventListener('pointerleave', onMouseLeave)
    document.removeEventListener('pointerenter', onMouseEnter)
    document.removeEventListener('pointerover', onMouseOverGlobal)
    document.removeEventListener('click', onClickGlobal)
    document.removeEventListener('pointerdown', onMouseDownGlobal)
    document.removeEventListener('pointerup', onMouseUpGlobal)
    document.body.classList.remove('custom-cursor-enabled')
    gsap.ticker.remove(render)
    gsap.killTweensOf(state)
  })

  return {
    coreRef,
    trailRef,
    ringRef,
    isHidden,
    isPreloading
  }
}
