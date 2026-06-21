<template>
  <div 
    v-show="isVisible"
    class="fixed inset-0 w-full h-[100dvh] z-[100] overflow-hidden flex flex-col bg-[#050505]"
    :class="[isMenuTransitioning ? 'transition-opacity' : '', isMenuOpenLocal ? '!opacity-0 duration-[1000ms]' : '']"
    ref="containerRef"
  >

    <!-- Контент -->
    <div ref="contentRef" class="relative w-full h-full opacity-0 pointer-events-none overflow-hidden">
      
      <!-- Верхний градиент (растворение к верху) -->
      <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#050505] via-[#050505]/80 to-transparent z-[80] pointer-events-none"></div>

      <!-- Нижний градиент (мягкое растворение снизу) -->
      <div class="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#050505] to-transparent z-[80] pointer-events-none"></div>
      
      <!-- Кнопка назад -->
      <button 
        class="back-btn absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 active:text-white transition-colors z-[110] flex items-center"
        :class="isInteractive ? 'pointer-events-auto' : 'pointer-events-none'"
        @click="closeStack"
      >
        <div class="relative w-12 h-12 flex items-center justify-center rounded-full border border-white/20 active:border-transparent transition-colors duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
          <svg class="w-5 h-5 transform active:-translate-x-0.5 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </div>
      </button>

      <!-- Обертка для тач-событий (перехватывает свайпы) -->
      <div class="w-full h-full relative z-[70] touch-manipulation"
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
            class="tech-item relative p-6 rounded-2xl border border-white/10 bg-white/5 overflow-hidden w-full"
          >
            <!-- Фоновый номер -->
            <span class="absolute -right-2 -bottom-4 font-primary font-black text-8xl text-white/5 pointer-events-none select-none">
              0{{ i + 1 }}
            </span>
            
            <h4 class="relative z-10 font-primary text-2xl font-bold text-white uppercase">{{ tech.name }}</h4>
            <p class="relative z-10 font-secondary text-sm text-white/60 mt-2 leading-relaxed">{{ tech.desc }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useEventBus } from '~/composables/useEventBus'

const props = defineProps<{
  isOpen: boolean
}>()

const emitParent = defineEmits(['close'])

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit } = useEventBus()

const isVisible = ref(false)
const isInteractive = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const cardsWrapperRef = ref<HTMLElement | null>(null)

let openTimeline: gsap.core.Timeline | null = null

const techList = [
  { name: 'Vue 3 & Nuxt 4', desc: 'Мощный реактивный движок и SSR для мгновенной загрузки.' },
  { name: 'GSAP 3', desc: 'Математически выверенные 60fps анимации без нагрузки на CPU.' },
  { name: 'Tailwind CSS', desc: 'Утилитарный подход к стилизации, нулевой оверхед.' },
  { name: 'Canvas & SVG', desc: 'Органический рендер графики и жидкие формы.' }
]

let isClosing = false;

// Custom Drag Scroll Logic
let startY = 0
let scrollY = 0
let maxScroll = 0
let isDragging = false

const calculateMaxScroll = () => {
  if (cardsWrapperRef.value && contentRef.value) {
    maxScroll = Math.max(0, cardsWrapperRef.value.scrollHeight - contentRef.value.clientHeight)
  }
}

const onTouchStart = (e: TouchEvent) => {
  if (!isInteractive.value || isClosing) return
  isDragging = true
  startY = e.touches[0]?.clientY ?? 0
  
  if (cardsWrapperRef.value) {
    gsap.killTweensOf(cardsWrapperRef.value)
  }
}

const onTouchMove = (e: TouchEvent) => {
  if (!isDragging || !isInteractive.value || isClosing) return
  
  const y = e.touches[0]?.clientY ?? 0
  const deltaY = y - startY
  startY = y
  
  scrollY += deltaY
  calculateMaxScroll()
  
  // Rubber band effect (резинка по краям)
  let renderY = scrollY
  if (scrollY > 0) {
    renderY = scrollY * 0.4
  } else if (scrollY < -maxScroll) {
    const over = scrollY + maxScroll
    renderY = -maxScroll + over * 0.4
  }
  
  if (cardsWrapperRef.value) {
    gsap.set(cardsWrapperRef.value, { y: renderY })
  }
}

const onTouchEnd = () => {
  if (!isDragging) return
  isDragging = false
  
  // Привязка (snap) к границам после отпускания
  let targetY = scrollY
  if (scrollY > 0) {
    targetY = 0
  } else if (scrollY < -maxScroll) {
    targetY = -maxScroll
  }
  
  scrollY = targetY
  
  if (cardsWrapperRef.value) {
    gsap.to(cardsWrapperRef.value, { 
      y: targetY, 
      duration: 0.5, 
      ease: 'power3.out' 
    })
  }
}

const openStack = () => {
  isClosing = false;
  isVisible.value = true
  isInteractive.value = false
  scrollY = 0
  
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
    const backBtn = contentRef.value?.querySelector('.back-btn') // backbtn is outside wrapper now, but let's select globally
    const backBtnElement = contentRef.value?.querySelector('.back-btn')

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

    if (backBtnElement) {
      openTimeline.fromTo(backBtnElement,
        { x: 20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        'start+=0.2'
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

onBeforeUnmount(() => {
  if (openTimeline) openTimeline.kill()
})
</script>

<style scoped>
.touch-manipulation {
  touch-action: none;
}
</style>
