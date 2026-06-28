import { onMounted, onBeforeUnmount, watch, nextTick, type Ref } from 'vue'

interface GyroNode {
  el: HTMLElement
  x: number
  y: number
  vx: number
  vy: number
  depth: number
}

interface DeviceOrientationEventWithPermission extends DeviceOrientationEvent {
  requestPermission?: () => Promise<PermissionState>
}

// Синхронный запрос разрешения iOS, вызываемый напрямую в обработчике клика открытия меню
export function triggeriOSGyroPermission() {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return

  const DOEvent = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission
  if (typeof DOEvent !== 'undefined' && typeof DOEvent.requestPermission === 'function') {
    DOEvent.requestPermission().catch(() => {})
  }
}

export function useMobileGyroMenu(isOpen: Ref<boolean>) {
  let nodes: GyroNode[] = []
  let rAF: number | null = null
  let isListening = false

  let targetX = 0
  let targetY = 0

  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma === null || e.beta === null) return

    // Абсолютный угол наклона (gamma влево/вправо, beta вперёд/назад с расчётом на естественное положение в руке ~45°)
    let deltaGamma = e.gamma
    let deltaBeta = e.beta - 45

    // Ограничиваем максимальный угол (±45 градусов)
    deltaGamma = Math.max(-45, Math.min(45, deltaGamma))
    deltaBeta = Math.max(-45, Math.min(45, deltaBeta))

    // Прямой мгновенный отклик гироскопа (высокая чувствительность)
    targetX = deltaGamma * 2.5
    targetY = deltaBeta * 2.5
  }

  // Fallback: управление через тач-перемещение пальца (если сайт открыт по HTTP или гироскоп недоступен)
  const handleTouchMove = (e: TouchEvent) => {
    if (!isOpen.value || !e.touches[0]) return
    const touch = e.touches[0]
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    targetX = (touch.clientX - centerX) * 0.25
    targetY = (touch.clientY - centerY) * 0.25
  }

  const startListening = () => {
    if (isListening || typeof window === 'undefined') return
    window.addEventListener('deviceorientation', handleOrientation, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    isListening = true
  }

  const stopListening = () => {
    if (!isListening || typeof window === 'undefined') return
    window.removeEventListener('deviceorientation', handleOrientation)
    window.removeEventListener('touchmove', handleTouchMove)
    isListening = false
  }

  const requestGyroPermission = () => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      startListening()
      return
    }

    const DOEvent = window.DeviceOrientationEvent as unknown as DeviceOrientationEventWithPermission
    if (typeof DOEvent !== 'undefined' && typeof DOEvent.requestPermission === 'function') {
      DOEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === 'granted') {
            startListening()
          }
        })
        .catch((err: unknown) => {
          console.warn('[useMobileGyroMenu] iOS gyro permission error:', err)
          startListening()
        })
    } else {
      // Android или стандартные браузеры
      startListening()
    }
  }

  const initPhysics = () => {
    if (typeof document === 'undefined') return
    const elements = document.querySelectorAll('.mobile-physics-item')
    if (!elements.length) return

    nodes = Array.from(elements).map((el, index) => {
      // Каскадная глубина от 1.5 до 0.6 для красивого 3D-веера слов
      const depth = Math.max(0.6, Math.min(1.6, 1.4 - index * 0.2))
      return {
        el: el as HTMLElement,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        depth
      }
    })
  }

  const render = () => {
    // Автоинициализация: если ноды не были найдены при открытии, ищем их снова
    if (isOpen.value && nodes.length === 0) {
      initPhysics()
    }

    // Если меню закрыто и все элементы успокоились около нуля, останавливаем анимацию
    if (!isOpen.value && nodes.every(n => Math.abs(n.x) < 0.05 && Math.abs(n.y) < 0.05)) {
      if (rAF !== null) {
        cancelAnimationFrame(rAF)
        rAF = null
      }
      return
    }

    rAF = requestAnimationFrame(render)

    nodes.forEach((node) => {
      // При открытом меню стремимся к смещению гироскопа с учетом глубины элемента
      const destX = isOpen.value ? targetX * node.depth : 0
      const destY = isOpen.value ? targetY * node.depth : 0

      // Плавная физика пружины
      const spring = isOpen.value ? 0.08 : 0.10
      const friction = isOpen.value ? 0.80 : 0.75

      node.vx += (destX - node.x) * spring
      node.vy += (destY - node.y) * spring
      node.vx *= friction
      node.vy *= friction

      node.x += node.vx
      node.y += node.vy

      if (node.el) {
        node.el.style.transform = `translate3d(${node.x.toFixed(2)}px, ${node.y.toFixed(2)}px, 0)`
      }
    })
  }

  watch(isOpen, (newVal) => {
    if (newVal) {
      requestGyroPermission()
      nextTick(() => {
        initPhysics()
        if (rAF === null) {
          rAF = requestAnimationFrame(render)
        }
      })
    } else {
      targetX = 0
      targetY = 0
    }
  })

  let initTimer: ReturnType<typeof setTimeout> | null = null

  onMounted(() => {
    initTimer = setTimeout(() => {
      initPhysics()
    }, 150)
  })

  const cleanup = () => {
    if (initTimer) {
      clearTimeout(initTimer)
      initTimer = null
    }
    stopListening()
    if (rAF !== null) {
      cancelAnimationFrame(rAF)
      rAF = null
    }
  }

  onBeforeUnmount(cleanup)

  return {
    cleanup
  }
}
