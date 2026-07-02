import type { Ref } from 'vue'
import gsap from 'gsap'

interface DragScrollOptions {
  /** Клиппирующий контейнер с фиксированной (анимируемой) высотой */
  viewport: Ref<HTMLElement | null>
  /** Внутренний трек, который физически двигается по оси Y */
  track: Ref<HTMLElement | null>
}

/**
 * Кастомный тач-скролл с инерцией и резинкой по краям.
 * Нужен потому, что проект глобально отключает нативный тач-скролл
 * (`body { touch-action: none }` + GSAP Observer с preventDefault).
 * Логика повторяет проверенный подход секции «Технологии» (TechStack).
 */
export function useDragScroll({ viewport, track }: DragScrollOptions) {
  let scrollY = 0
  let startY = 0
  let lastY = 0
  let lastTime = 0
  let velocity = 0
  let maxScroll = 0
  let dragging = false

  const recalc = () => {
    if (track.value && viewport.value) {
      maxScroll = Math.max(0, track.value.scrollHeight - viewport.value.clientHeight)
    }
  }

  const reset = () => {
    scrollY = 0
    velocity = 0
    dragging = false
    if (track.value) {
      gsap.killTweensOf(track.value)
      gsap.set(track.value, { y: 0 })
    }
    recalc()
  }

  const onTouchStart = (e: TouchEvent) => {
    dragging = true
    startY = e.touches[0]?.clientY ?? 0
    lastY = startY
    lastTime = performance.now()
    velocity = 0

    if (track.value) {
      gsap.killTweensOf(track.value)
      // Подхватываем позицию, если скролл ещё летел по инерции
      const currentY = gsap.getProperty(track.value, 'y') as number
      if (!Number.isNaN(currentY)) scrollY = currentY
    }
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!dragging) return

    const y = e.touches[0]?.clientY ?? 0
    const now = performance.now()
    const dt = now - lastTime
    if (dt > 0) {
      const instantVel = (y - lastY) / dt
      velocity = velocity * 0.7 + instantVel * 0.3
    }
    lastY = y
    lastTime = now

    const deltaY = y - startY
    startY = y
    scrollY += deltaY
    recalc()

    // Мягкая премиальная резинка по краям
    let renderY = scrollY
    if (scrollY > 0) {
      renderY = scrollY * 0.35
    } else if (scrollY < -maxScroll) {
      const over = scrollY + maxScroll
      renderY = -maxScroll + over * 0.35
    }

    if (track.value) gsap.set(track.value, { y: renderY })
  }

  const onTouchEnd = () => {
    if (!dragging) return
    dragging = false

    // Палец замер перед отпусканием — гасим инерцию
    if (performance.now() - lastTime > 80) velocity = 0

    recalc()

    const momentum = velocity * 220
    let targetY = scrollY + momentum
    if (targetY > 0) targetY = 0
    else if (targetY < -maxScroll) targetY = -maxScroll
    scrollY = targetY

    const duration = Math.min(1.4, Math.max(0.6, Math.abs(velocity) * 0.45))
    if (track.value) {
      gsap.to(track.value, { y: targetY, duration, ease: 'power3.out' })
    }
  }

  const destroy = () => {
    if (track.value) gsap.killTweensOf(track.value)
  }

  return { onTouchStart, onTouchMove, onTouchEnd, recalc, reset, destroy }
}
