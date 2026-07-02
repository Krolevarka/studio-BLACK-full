import { onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

interface PhysicsNode {
  el: HTMLElement
  x: number
  y: number
  vx: number
  vy: number
  scale: number
  isHovered: boolean
  baseCx: number
  baseCy: number
}

export function usePhysicsMenu(isOpen: Ref<boolean>) {
  let nodes: PhysicsNode[] = []
  let rAF: number | null = null
  const mouse = { x: -1000, y: -1000 }

  const onMouseEnter = (index: number) => {
    if (nodes[index]) nodes[index].isHovered = true
  }
  const onMouseLeave = (index: number) => {
    if (nodes[index]) nodes[index].isHovered = false
  }

  const onMouseMove = (e: MouseEvent) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
  }

  const initPhysics = () => {
    const elements = document.querySelectorAll('.physics-item')
    if (!elements.length) return

    nodes = Array.from(elements).map((el) => {
      const rect = el.getBoundingClientRect()
      return {
        el: el as HTMLElement,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        scale: 1,
        isHovered: false,
        baseCx: rect.left + rect.width / 2,
        baseCy: rect.top + rect.height / 2
      }
    })
  }

  const render = () => {
    // Если закрыто, сбрасываем всё к нулю
    if (!isOpen.value && nodes.every(n => Math.abs(n.x) < 0.1 && Math.abs(n.y) < 0.1 && Math.abs(n.scale - 1) < 0.01)) {
      if (rAF !== null) {
        cancelAnimationFrame(rAF)
        rAF = null
      }
      return
    }

    rAF = requestAnimationFrame(render)

    nodes.forEach((node) => {
      let targetX = 0
      let targetY = 0
      let targetScale = 1

      if (isOpen.value) {
        // Используем предварительно вычисленный центр
        const cx = node.baseCx
        const cy = node.baseCy
        
        const dx = mouse.x - cx
        const dy = mouse.y - cy
        
        // Дистанция по Y определяет "зону влияния" (магнитное поле вокруг списка)
        const distY = Math.abs(dy)
        const distX = Math.abs(dx)
        
        // Elastic String: если курсор рядом по Y, элемент слегка выгибается к нему по X
        if (distY < 350 && distX < window.innerWidth / 2) {
          // Сила влияния зависит от удаленности по Y
          const pullStrength = Math.max(0, 1 - distY / 350)
          
          // Выгибание в сторону курсора
          targetX = (dx * 0.08) * pullStrength
          
          // Эффект macOS Dock: соседние элементы слегка увеличиваются
          targetScale = 1 + (0.05 * pullStrength)
        }

        // Если мы навели прямо на элемент (Hover)
        if (node.isHovered) {
          // Тяжелый магнетизм: элемент сильно тянется к курсору, но ограничен
          targetX = dx * 0.15
          targetY = dy * 0.15
          targetScale = 1.15 // Главное увеличение
        }
      }

      // Параметры "тяжелой" пружины
      let spring = node.isHovered ? 0.08 : 0.05
      let friction = node.isHovered ? 0.75 : 0.82

      // Если меню закрывается, делаем возврат к центру очень плавным (без резких рывков)
      if (!isOpen.value) {
        spring = 0.01
        friction = 0.90
      }

      node.vx += (targetX - node.x) * spring
      node.vy += (targetY - node.y) * spring

      node.vx *= friction
      node.vy *= friction

      node.x += node.vx
      node.y += node.vy
      
      // Плавное изменение масштаба
      node.scale += (targetScale - node.scale) * 0.15

      if (node.el) {
        node.el.style.transform = `translate(${node.x}px, ${node.y}px) scale(${node.scale})`
      }
    })
  }

  watch(isOpen, (newVal) => {
    if (!newVal) {
      nodes.forEach(n => n.isHovered = false)
    } else {
      // Перезапуск цикла рендеринга при открытии меню
      if (rAF === null) {
        rAF = requestAnimationFrame(render)
      }
    }
  })

  let initTimer: ReturnType<typeof setTimeout> | null = null

  onMounted(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('resize', initPhysics)
    
    initTimer = setTimeout(() => {
      initPhysics()
      rAF = requestAnimationFrame(render)
    }, 150)
  })

  onBeforeUnmount(() => {
    if (initTimer) clearTimeout(initTimer)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', initPhysics)
    if (rAF !== null) {
      cancelAnimationFrame(rAF)
    }
  })

  return {
    onMouseEnter,
    onMouseLeave
  }
}
