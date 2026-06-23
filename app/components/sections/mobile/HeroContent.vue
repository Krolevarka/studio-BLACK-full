<template>
  <section v-bind="$attrs" class="snap-section relative h-dvh w-full overflow-hidden bg-transparent flex flex-col justify-center items-center">
    
    <!-- Текстовый контент -->
    <div class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 mix-blend-difference transform-gpu pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      
      <!-- Брутальный заголовок (уменьшенный для мобильных) -->
      <div role="heading" aria-level="1" class="font-primary text-4xl md:text-5xl font-bold tracking-tighter text-white leading-[0.9] mb-6 flex flex-col">
        <div class="overflow-hidden pointer-events-auto">
          <div class="block transition-all duration-700 ease-out" 
               :class="isReady ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
            СИЛЬНЫЕ
          </div>
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <div class="block transition-all duration-700 delay-100 ease-out" 
               :class="isReady ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
            ЦИФРОВЫЕ
          </div>
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <div class="block transition-all duration-700 delay-200 ease-out" 
               :class="isReady ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
            РЕШЕНИЯ
          </div>
        </div>
      </div>
      
      <p class="font-secondary text-xs md:text-sm uppercase tracking-[0.2em] text-white/80 max-w-xs md:max-w-md mb-10 pointer-events-auto transition-all duration-700 delay-300 ease-out"
         :class="isReady ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'">
        Проектирование и разработка сайтов премиального уровня.
      </p>
      
      <div class="pointer-events-auto transition-all duration-700 delay-400 ease-out"
           :class="isReady ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'">
        <UiButton class="font-secondary !bg-transparent !text-white !border !border-white/30 active:!bg-white/10 transition-colors duration-200 min-h-[2.75rem] min-w-[2.75rem] px-6 py-3 flex items-center justify-center touch-manipulation" to="#contact">
          Обсудить проект
        </UiButton>
      </div>

    </div>

    <!-- Подсказка скролла -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 mix-blend-difference transform-gpu z-20 pointer-events-none transition-all duration-[1500ms] ease-out"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : ''),
           (isReady && !hasScrolled) ? 'translate-y-0 opacity-100 delay-500' : 'translate-y-4 opacity-0 delay-0'
         ]">
      <UiScrollHint />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'

defineOptions({ inheritAttrs: false })

const isReady = ref(false)
const hasScrolled = ref(false)

const handleScroll = () => {
  if (window.scrollY > 20) {
    hasScrolled.value = true
    window.removeEventListener('scroll', handleScroll)
  }
}

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { on } = useEventBus()

let preloaderTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  const handlePreloaderDone = () => {
    if (isReady.value) return
    // Используем requestAnimationFrame для синхронизации с рендером браузера
    rafId = requestAnimationFrame(() => {
      isReady.value = true
    })
  }

  on('preloader-done', handlePreloaderDone)
  
  // Фолбэк, если прелоадера нет или он уже прошел
  preloaderTimer = setTimeout(handlePreloaderDone, 4500)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (preloaderTimer) clearTimeout(preloaderTimer)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<style scoped>
.touch-manipulation {
  touch-action: none;
}
</style>
