<template>
  <div 
    v-show="isVisible"
    class="absolute inset-0 w-full h-full z-50 overflow-hidden flex"
    :class="[isMenuTransitioning ? 'transition-opacity' : '', isMenuOpenLocal ? '!opacity-0 duration-[1000ms]' : '']"
    ref="containerRef"
  >

    <!-- Контент -->
    <div ref="contentRef" class="relative z-10 flex w-full h-full opacity-0 pointer-events-none">
      
      <!-- Кнопка назад -->
      <button 
        class="back-btn fixed top-6 right-6 md:top-10 md:right-10 text-white/50 hover:text-white transition-colors uppercase font-primary tracking-widest text-[clamp(12px,1vw,14px)] z-[70] flex items-center group"
        :class="isInteractive ? 'pointer-events-auto' : 'pointer-events-none'"
        @click="closeStack"
      >
        <span class="mr-3 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">Назад</span>
        <div class="magnetic-btn relative w-12 h-12 flex items-center justify-center rounded-full border border-white/20 group-hover:border-transparent transition-colors duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
          <svg class="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </div>
      </button>

      <!-- Левая часть: Место под движок сферы (OrganicCore рисует под нами) -->
      <div class="w-1/2 h-full flex items-center justify-center relative pointer-events-none">
      </div>

      <!-- Правая часть: Список технологий -->
      <div class="w-1/2 h-full flex flex-col justify-center pr-24 relative" 
           :class="isInteractive ? 'pointer-events-auto' : 'pointer-events-none'" 
           @mouseleave="clearSphereDistortion">
        <h3 class="tech-title font-primary text-[clamp(2rem,4vw,3rem)] font-black text-white uppercase mb-12">Технологии</h3>
        
        <div class="flex flex-col w-fit">
          <div 
            v-for="(tech, i) in techList" 
            :key="i"
            class="tech-item group relative py-4 pl-8 border-l-2 border-white/10 hover:border-white transition-colors duration-500 cursor-pointer w-full"
            @mouseenter="triggerSphereDistortion(i)"
            @mouseleave="clearSphereDistortion"
          >
            <h4 class="font-primary text-[clamp(1.5rem,2.5vw,1.875rem)] font-bold text-white/50 group-hover:text-white transition-colors duration-500 uppercase">{{ tech.name }}</h4>
            <p class="font-secondary text-[clamp(12px,1vw,14px)] text-white/40 mt-2 max-w-md group-hover:text-white/80 transition-colors duration-500">{{ tech.desc }}</p>
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

let openTimeline: gsap.core.Timeline | null = null

const techList = [
  { name: 'Vue 3 & Nuxt 4', desc: 'Мощный реактивный движок и SSR для мгновенной загрузки и идеального SEO.' },
  { name: 'GSAP 3', desc: 'Математически выверенные анимации при 60 кадрах в секунду без лишней нагрузки на CPU.' },
  { name: 'Tailwind CSS', desc: 'Утилитарный подход к стилизации. Нулевой оверхед, максимальный контроль над пикселями.' },
  { name: 'Canvas & SVG', desc: 'Органический рендер графики и частиц, чистая математика и жидкие формы без тяжелых 3D-библиотек.' }
]

let isClosing = false;

const triggerSphereDistortion = (index: number) => {
  if (isClosing) return;
  emit('techstack-state', { active: true, hoveredIndex: index })
}

const clearSphereDistortion = () => {
  if (isClosing) return;
  emit('techstack-state', { active: true, hoveredIndex: -1 })
}

const openStack = () => {
  isClosing = false;
  isVisible.value = true
  isInteractive.value = false
  emit('techstack-state', { active: true, hoveredIndex: -1 })
  nextTick(() => {
    if (openTimeline) openTimeline.kill()
    openTimeline = gsap.timeline({
      onComplete: () => {
        isInteractive.value = true
        if (contentRef.value) contentRef.value.style.pointerEvents = 'auto'
      }
    })

    if (contentRef.value) {
      gsap.set(contentRef.value, { opacity: 1 })
    }

    const title = contentRef.value?.querySelector('.tech-title')
    const backBtn = contentRef.value?.querySelector('.back-btn')
    const techItems = contentRef.value?.querySelectorAll('.tech-item')

    openTimeline.addLabel('start', '+=0.6')

    if (title) {
      openTimeline.fromTo(title, 
        { y: 50, opacity: 0, rotationX: -30, transformPerspective: 500 }, 
        { y: 0, opacity: 1, rotationX: 0, duration: 0.8, ease: 'back.out(1.5)' },
        'start'
      )
    }

    if (techItems && techItems.length > 0) {
      openTimeline.fromTo(techItems, 
        { x: 50, opacity: 0, skewX: -5 },
        { x: 0, opacity: 1, skewX: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
        'start+=0.2'
      )
    }

    if (backBtn) {
      openTimeline.fromTo(backBtn,
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' },
        'start+=0.4'
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

  // Возвращаем сферу к состоянию Approach
  emit('techstack-state', { active: false })

  openTimeline.to(contentRef.value, {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in'
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

