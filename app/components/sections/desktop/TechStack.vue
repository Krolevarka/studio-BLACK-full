<template>
  <div 
    v-show="isVisible"
    ref="containerRef"
    class="absolute inset-0 w-full h-full z-50 overflow-hidden flex"
    :class="[isMenuTransitioning ? 'transition-opacity' : '', isMenuOpenLocal ? '!opacity-0 duration-[1000ms]' : '']"
  >

    <!-- Контент -->
    <div ref="contentRef" class="relative z-10 flex w-full h-full opacity-0 pointer-events-none">
      
      <!-- Левая часть: Место под движок сферы (OrganicCore рисует под нами) -->
      <div class="w-1/2 h-full flex items-center justify-center relative pointer-events-none"/>

      <!-- Правая часть: Список технологий -->
      <div
class="w-1/2 h-full flex flex-col justify-center pr-24 relative" 
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

let openTimeline: gsap.core.Timeline | null = null

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

onMounted(() => {
  on('techstack-close', () => {
    if (isVisible.value) closeStack()
  })
})

onBeforeUnmount(() => {
  if (openTimeline) openTimeline.kill()
})
</script>
