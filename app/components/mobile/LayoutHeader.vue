<template>
  <header 
    class="fixed top-0 left-0 w-full p-4 sm:p-6 z-[60] flex justify-between items-center pointer-events-none text-white mix-blend-difference transform-gpu header-anim"
    :class="[
      (isPreloading || isContactTyping || (isScrolling && !isMenuOpen)) ? 'header-anim-hidden pointer-events-none' : 'header-anim-visible'
    ]"
  >
    <a href="#hero" @click.prevent="$emit('logo-click')" 
       class="w-20 sm:w-24 flex items-center min-h-[2.75rem] min-w-[2.75rem] transition-opacity duration-500"
       :class="(isScrolling && !isMenuOpen) || isContactTyping || isPriceModalOpen ? 'pointer-events-none opacity-0' : 'pointer-events-auto cursor-pointer opacity-100'"
       style="touch-action: none;">
      <LogoText class="w-full h-auto fill-current" />
    </a>
    
    <button 
      @click="$emit('toggle-menu')"
      @keydown.enter="$emit('toggle-menu')"
      aria-label="Переключить меню навигации"
      :aria-expanded="isMenuOpen"
      role="button"
      tabindex="0"
      class="relative w-12 h-12 flex items-center justify-center rounded-full min-h-[2.75rem] min-w-[2.75rem] transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
      :class="(isTechStackOpen || isPriceModalOpen || isContactTyping) ? 'opacity-0 pointer-events-none' : (isScrolling && !isMenuOpen ? 'pointer-events-none' : 'opacity-100 pointer-events-auto')"
      style="touch-action: none;"
    >
      <div class="relative w-6 h-6 flex items-center justify-center transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        <span class="absolute w-6 h-[1.5px] bg-white transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center"
              :class="[
                isMenuOpen || isMenuAnimating ? 'will-change-transform' : '',
                isMenuOpen ? 'rotate-45 translate-y-0 scale-x-100' : '-translate-y-[4px] scale-x-100'
              ]">
        </span>

        <span class="absolute w-6 h-[1.5px] bg-white transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center"
              :class="[
                isMenuOpen || isMenuAnimating ? 'will-change-transform' : '',
                isMenuOpen ? '-rotate-45 translate-y-0 scale-x-100' : 'translate-y-[4px] scale-x-100'
              ]">
        </span>
      </div>
    </button>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useNuxtApp, useState } from '#imports'

const props = defineProps<{
  isPreloading: boolean
  isMenuOpen: boolean
  isMenuAnimating: boolean
  isContactTyping?: boolean
  isTechStackOpen?: boolean
  isPriceModalOpen?: boolean
}>()

defineEmits<{
  (e: 'logo-click'): void
  (e: 'toggle-menu'): void
}>()

interface LenisScrollEvent {
  velocity?: number
}

const isScrolling = ref(false)
const isAnimating = useState('isAnimating', () => false)
let scrollTimer: ReturnType<typeof setTimeout> | null = null
let touchStartY = 0
let lenisHandler: ((...args: unknown[]) => void) | null = null

const triggerScroll = () => {
  if (props.isMenuOpen || props.isPreloading || props.isTechStackOpen) return
  isScrolling.value = true
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    if (isAnimating.value) {
      triggerScroll()
    } else {
      isScrolling.value = false
    }
  }, 250)
}

watch(() => props.isMenuOpen, (isOpen) => {
  if (isOpen) {
    isScrolling.value = false
    if (scrollTimer) clearTimeout(scrollTimer)
  }
})

watch(isAnimating, (animating) => {
  if (animating) triggerScroll()
})

const onTouchStart = (e: TouchEvent) => {
  if (e.touches[0]) touchStartY = e.touches[0].clientY
}

const onTouchMove = (e: TouchEvent) => {
  if (!e.touches[0] || props.isMenuOpen) return
  const deltaY = Math.abs(e.touches[0].clientY - touchStartY)
  if (deltaY > 10) {
    triggerScroll()
  }
}

const onWheel = () => {
  triggerScroll()
}

const onWindowScroll = () => {
  triggerScroll()
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
  }

  const { $lenis } = useNuxtApp()
  if ($lenis) {
    lenisHandler = (...args: unknown[]) => {
      const e = args[0] as LenisScrollEvent | undefined
      if (e && typeof e.velocity === 'number' && Math.abs(e.velocity) > 0.05) {
        triggerScroll()
      }
    }
    $lenis.on('scroll', lenisHandler)
  }
})

onBeforeUnmount(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onWindowScroll)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
  }
  const { $lenis } = useNuxtApp()
  if ($lenis && lenisHandler) {
    $lenis.off('scroll', lenisHandler)
  }
})
</script>

<style scoped>
.header-anim {
  transition-property: opacity, transform;
  transition-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
  will-change: transform, opacity;
}

.header-anim-hidden {
  opacity: 0;
  transform: translate3d(0, -6px, 0);
  transition-duration: 250ms, 600ms; /* 250ms для opacity, 600ms для плавного смещения на 6px */
}

.header-anim-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition-duration: 600ms, 600ms;
}
</style>
