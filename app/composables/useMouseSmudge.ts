import { onMounted, onBeforeUnmount } from 'vue'

let isInitialized = false
let activeInstances = 0

let rafId: number | null = null
let lastX = 0
let lastY = 0
let lastTime = 0
let isFirstMove = true
let targetDx = 0
let targetDy = 0
let currentDx = 0
let currentDy = 0
let hoveredElement: HTMLElement | null = null

let onMouseOver: (e: MouseEvent) => void
let onMouseOut: (e: MouseEvent) => void
let onMouseMove: (e: MouseEvent) => void
let updateLoop: () => void

const initLogic = () => {
  if (isInitialized) return
  isInitialized = true

  onMouseOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (target && target.classList && target.classList.contains('hover-blur-char')) {
      hoveredElement = target
    }
  }

  onMouseOut = (e: MouseEvent) => {
    if (e.target === hoveredElement) {
      if (hoveredElement) {
        hoveredElement.style.removeProperty('--mouse-dx')
        hoveredElement.style.removeProperty('--mouse-dy')
        hoveredElement.style.removeProperty('--mouse-speed')
      }
      hoveredElement = null
    }
  }

  onMouseMove = (e: MouseEvent) => {
    const now = performance.now()
    if (isFirstMove) {
      lastX = e.clientX
      lastY = e.clientY
      lastTime = now
      isFirstMove = false
      return
    }

    const dt = Math.max(1, now - lastTime)
    const deltaX = e.clientX - lastX
    const deltaY = e.clientY - lastY
    
    const vx = deltaX / dt
    const vy = deltaY / dt
    
    targetDx = vx * 20
    targetDy = vy * 20

    targetDx = Math.max(-60, Math.min(60, targetDx))
    targetDy = Math.max(-60, Math.min(60, targetDy))

    lastX = e.clientX
    lastY = e.clientY
    lastTime = now

    if (rafId === null && typeof window !== 'undefined') {
      rafId = requestAnimationFrame(updateLoop)
    }
  }

  updateLoop = () => {
    targetDx *= 0.85
    targetDy *= 0.85

    currentDx += (targetDx - currentDx) * 0.2
    currentDy += (targetDy - currentDy) * 0.2

    if (Math.abs(currentDx) < 0.1 && Math.abs(currentDy) < 0.1 && Math.abs(targetDx) < 0.1 && Math.abs(targetDy) < 0.1) {
      currentDx = 0
      currentDy = 0
      targetDx = 0
      targetDy = 0
      
      if (hoveredElement) {
        hoveredElement.style.setProperty('--mouse-dx', `0px`)
        hoveredElement.style.setProperty('--mouse-dy', `0px`)
        hoveredElement.style.setProperty('--mouse-speed', `0`)
      }
      rafId = null
      return
    }

    const speed = Math.sqrt(currentDx * currentDx + currentDy * currentDy)

    if (hoveredElement) {
      if (!document.contains(hoveredElement)) {
        hoveredElement = null
      } else {
        hoveredElement.style.setProperty('--mouse-dx', `${currentDx.toFixed(2)}px`)
        hoveredElement.style.setProperty('--mouse-dy', `${currentDy.toFixed(2)}px`)
        hoveredElement.style.setProperty('--mouse-speed', `${speed.toFixed(2)}`)
      }
    }

    rafId = requestAnimationFrame(updateLoop)
  }
}

export function useMouseSmudge() {
  if (import.meta.server) return

  onMounted(() => {
    initLogic()
    activeInstances++
    if (activeInstances === 1) {
      isFirstMove = true
      targetDx = 0
      targetDy = 0
      currentDx = 0
      currentDy = 0
      window.addEventListener('mousemove', onMouseMove, { passive: true })
      window.addEventListener('mouseover', onMouseOver)
      window.addEventListener('mouseout', onMouseOut)
    }
  })

  onBeforeUnmount(() => {
    activeInstances--
    if (activeInstances <= 0) {
      activeInstances = 0
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseover', onMouseOver)
      window.removeEventListener('mouseout', onMouseOut)
      
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      hoveredElement = null
    }
  })
}
