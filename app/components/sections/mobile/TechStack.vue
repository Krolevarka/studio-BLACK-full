<template>
  <div 
    v-show="isVisible"
    ref="containerRef"
    class="fixed inset-0 w-full h-[100dvh] z-[100] overflow-hidden flex flex-col bg-[#050505]"
    :class="[isMenuTransitioning ? 'transition-opacity' : '', isMenuOpenLocal ? '!opacity-0 duration-[1000ms]' : '']"
  >

    <!-- Контент -->
    <div ref="contentRef" class="relative w-full h-full opacity-0 pointer-events-none overflow-hidden">
      
      <!-- Верхний градиент (растворение к верху) -->
      <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#050505] via-[#050505]/80 to-transparent z-[80] pointer-events-none"/>

      <!-- Нижний градиент (мягкое растворение снизу) -->
      <div class="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#050505] to-transparent z-[80] pointer-events-none"/>
      
      <!-- Обертка для тач-событий (перехватывает свайпы) -->
      <div
class="w-full h-full relative z-[70] touch-manipulation"
           :class="isInteractive ? 'pointer-events-auto' : 'pointer-events-none'"
           @touchstart="onTouchStart"
           @touchmove="onTouchMove"
           @touchend="onTouchEnd">
           
        <!-- Внутренний контейнер, который двигается с помощью GSAP -->
        <div ref="cardsWrapperRef" class="flex flex-col gap-4 w-full px-6 pt-24 pb-20 will-change-transform">
          <h3 class="tech-title font-primary text-3xl font-black text-white uppercase mb-8">Технологии</h3>
          
          <div 
            v-for="(tech, i) in techList" 
            :key="i"
            class="tech-item p-6 rounded-2xl border-2 border-white bg-transparent w-full"
          >
            <h4 class="font-primary text-2xl font-bold text-white uppercase">{{ tech.name }}</h4>
            <p class="font-secondary text-sm text-white/60 mt-2 leading-relaxed">{{ tech.desc }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useEventBus } from '~/composables/useEventBus'
import { techList } from '~/data/techStack'

const props = defineProps<{
  isOpen: boolean
}>()

const emitParent = defineEmits(['close'])

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()

const isVisible = ref(false)
const isInteractive = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const cardsWrapperRef = ref<HTMLElement | null>(null)

let openTimeline: gsap.core.Timeline | null = null

let isClosing = false;

// Custom Drag Scroll Logic
// Custom Premium Inertia Drag Scroll Logic
let startY = 0
let scrollY = 0
let maxScroll = 0
let isDragging = false
let lastY = 0
let lastTime = 0
let velocity = 0

const calculateMaxScroll = () => {
  if (cardsWrapperRef.value && contentRef.value) {
    maxScroll = Math.max(0, cardsWrapperRef.value.scrollHeight - contentRef.value.clientHeight)
  }
}

const onTouchStart = (e: TouchEvent) => {
  if (!isInteractive.value || isClosing) return
  isDragging = true
  startY = e.touches[0]?.clientY ?? 0
  lastY = startY
  lastTime = performance.now()
  velocity = 0
  
  if (cardsWrapperRef.value) {
    gsap.killTweensOf(cardsWrapperRef.value)
    // Подхватываем текущую позицию, если скролл ещё летел по инерции
    const currentY = gsap.getProperty(cardsWrapperRef.value, 'y') as number
    if (!isNaN(currentY)) {
      scrollY = currentY
    }
  }
}

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging || !isInteractive.value || isClosing) return
  
  const y = e.touches[0]?.clientY ?? 0
  const now = performance.now()
  const dt = now - lastTime
  
  if (dt > 0) {
    // Вычисляем мгновенную скорость (px/ms) и сглаживаем её
    const instantVel = (y - lastY) / dt
    velocity = velocity * 0.7 + instantVel * 0.3
  }
  lastY = y
  lastTime = now
  
  const deltaY = y - startY
  startY = y
  
  scrollY += deltaY
  calculateMaxScroll()
  
  // Эффект мягкой премиальной резинки по краям
  let renderY = scrollY
  if (scrollY > 0) {
    renderY = scrollY * 0.35
  } else if (scrollY < -maxScroll) {
    const over = scrollY + maxScroll
    renderY = -maxScroll + over * 0.35
  }
  
  if (cardsWrapperRef.value) {
    gsap.set(cardsWrapperRef.value, { y: renderY })
  }
}

const onTouchEnd = () => {
  if (!isDragging) return
  isDragging = false
  
  // Если палец оставался неподвижен перед отпусканием более 80 мс — сбрасываем инерцию
  if (performance.now() - lastTime > 80) {
    velocity = 0
  }
  
  calculateMaxScroll()
  
  // Вычисляем инерционный выбег
  const momentum = velocity * 220
  let targetY = scrollY + momentum
  
  // Мягкая привязка к границам контента
  if (targetY > 0) {
    targetY = 0
  } else if (targetY < -maxScroll) {
    targetY = -maxScroll
  }
  
  scrollY = targetY
  
  // Динамическая длительность анимации скольжения для шелковистого эффекта
  const duration = Math.min(1.4, Math.max(0.6, Math.abs(velocity) * 0.45))
  
  if (cardsWrapperRef.value) {
    gsap.to(cardsWrapperRef.value, { 
      y: targetY, 
      duration, 
      ease: 'power3.out' 
    })
  }
}

const openStack = () => {
  isClosing = false;
  isVisible.value = true
  isInteractive.value = false
  scrollY = 0
  velocity = 0
  
  // Сбрасываем позицию перед открытием
  if (cardsWrapperRef.value) {
    gsap.set(cardsWrapperRef.value, { y: 0 })
  }
  
  emit('techstack-state', { active: true, hoveredIndex: -1 })
  
  nextTick(() => {
    if (openTimeline) openTimeline.kill()
    openTimeline = gsap.timeline({
      onComplete: () => {
        isInteractive.value = true
        if (contentRef.value) contentRef.value.style.pointerEvents = 'auto'
      }
    })

    if (containerRef.value) {
      gsap.set(containerRef.value, { opacity: 0 })
      openTimeline.to(containerRef.value, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0)
    }

    if (contentRef.value) {
      gsap.set(contentRef.value, { opacity: 1 })
    }

    const title = cardsWrapperRef.value?.querySelector('.tech-title')
    const techItems = cardsWrapperRef.value?.querySelectorAll('.tech-item')

    openTimeline.addLabel('start', '+=0.2')

    if (title) {
      openTimeline.fromTo(title, 
        { y: 30, opacity: 0, rotationX: -20, transformPerspective: 500 }, 
        { y: 0, opacity: 1, rotationX: 0, duration: 0.6, ease: 'back.out(1.5)' },
        'start'
      )
    }

    if (techItems && techItems.length > 0) {
      openTimeline.fromTo(techItems, 
        { y: 40, opacity: 0, skewY: 2 },
        { y: 0, opacity: 1, skewY: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
        'start+=0.1'
      )
    }
  })
}

const closeStack = () => {
  isClosing = true;
  isInteractive.value = false;
  if (contentRef.value) contentRef.value.style.pointerEvents = 'none'
  if (openTimeline) openTimeline.kill()
  
  openTimeline = gsap.timeline({
    onComplete: () => {
      isVisible.value = false
      emitParent('close')
    }
  })

  emit('techstack-state', { active: false })

  openTimeline.to(containerRef.value, {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.inOut'
  })
}

watch(() => props.isOpen, (val) => {
  if (val) {
    openStack()
  } else if (isVisible.value) {
    closeStack()
  }
})

onMounted(() => {
  on('techstack-close', () => {
    if (isVisible.value) closeStack()
  })
})

onBeforeUnmount(() => {
  if (openTimeline) openTimeline.kill()
})
</script>

<style scoped>
.touch-manipulation {
  touch-action: none;
}
</style>
