<template>
  <section ref="portfolioRef" v-bind="$attrs" class="reveal-scope-mobile relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Контейнер -->
    <div class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 h-full pointer-events-none mix-blend-difference transform-gpu"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">

      <!-- Верхняя половина для заголовка -->
      <div class="flex-1 flex flex-col justify-end items-center pb-1.5 md:pb-12 w-full">
        <h2 class="reveal-item font-primary text-5xl sm:text-6xl font-black tracking-tighter text-white leading-[0.85] uppercase flex flex-col items-center"
            :class="{ 'is-revealed': revealed }">
          <div class="pointer-events-auto">ПЕРВЫЙ</div>
          <div class="pointer-events-auto">ПУЛЬС</div>
        </h2>
      </div>

      <!-- Нижняя половина для текста и кнопки -->
      <div class="flex-1 flex flex-col justify-start items-center pt-1.5 md:pt-12 w-full">
        <div class="flex flex-col items-center max-w-sm">
          <div class="overflow-hidden mb-8">
            <p class="reveal-item font-secondary text-sm md:text-base text-white leading-relaxed pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 140ms">
              Великие бренды не просто существуют — они живут. Наше портфолио ждёт проект, который задаст новый ритм всей индустрии. Готовы стать нашим первым ударом сердца?
            </p>
          </div>

          <div class="reveal-item pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 280ms">
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
import { ref } from 'vue'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'

defineOptions({ inheritAttrs: false })

const portfolioRef = ref<HTMLElement | null>(null)

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
// Унифицированное появление/исчезновение контента секции
const { revealed } = useSectionReveal('[ Проекты ]')
</script>

<style scoped>
.touch-manipulation {
  touch-action: none;
}
</style>
