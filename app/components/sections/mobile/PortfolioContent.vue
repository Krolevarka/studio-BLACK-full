<template>
  <section ref="portfolioRef" v-bind="$attrs" class="relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Контейнер -->
    <div class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 h-full pointer-events-none mix-blend-difference transform-gpu"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      
      <!-- Верхняя половина для заголовка -->
      <div class="flex-1 flex flex-col justify-end items-center pb-8 md:pb-12 w-full">
        <h2 class="font-primary text-5xl sm:text-6xl font-black tracking-tighter text-white leading-[0.85] uppercase flex flex-col items-center transition-all duration-1000 ease-out"
            :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'">
          <div class="pointer-events-auto">ПЕРВЫЙ</div>
          <div class="pointer-events-auto">ПУЛЬС</div>
        </h2>
      </div>
      
      <!-- Нижняя половина для текста и кнопки -->
      <div class="flex-1 flex flex-col justify-start items-center pt-8 md:pt-12 w-full">
        <div class="flex flex-col items-center max-w-sm">
          <div class="overflow-hidden mb-8">
            <p class="font-secondary text-sm md:text-base text-white leading-relaxed pointer-events-auto transition-all duration-1000 delay-300 ease-out"
               :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
              Великие бренды не просто существуют — они живут. Наше портфолио ждёт проект, который задаст новый ритм всей индустрии. Готовы стать нашим первым ударом сердца?
            </p>
          </div>
          
          <div class="pointer-events-auto transition-all duration-1000 delay-500 ease-out"
               :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'">
            <UiButton class="font-secondary !bg-transparent !text-white !border !border-white/30 active:!bg-white/10 transition-colors duration-200 min-h-[2.75rem] min-w-[2.75rem] px-8 py-3 flex items-center justify-center touch-manipulation" to="#contact">
              ЗАДАТЬ РИТМ
            </UiButton>
          </div>
        </div>
      </div>
      
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'

defineOptions({ inheritAttrs: false })

const portfolioRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible.value = true
        observer?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.3 })

  if (portfolioRef.value) {
    observer.observe(portfolioRef.value)
  }

  // Взаимодействие со сферой (перевод OrganicCore в режим капли)
  on('section-change', (label: string) => {
    if (label === '[ Проекты ]') {
      emit('portfolio-state', true)
    } else {
      emit('portfolio-state', false)
    }
  })
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
.touch-manipulation {
  touch-action: none;
}
</style>
