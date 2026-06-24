<template>
  <section ref="portfolioRef" v-bind="$attrs" class="relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Контейнер -->
    <div class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 h-full pointer-events-none mix-blend-difference transform-gpu"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">

      <!-- Заголовок поверх капли (анимация без маски, чтобы буква Й не обрезалась) -->
      <div class="mb-12">
        <h2 class="reveal-item font-primary text-[clamp(3rem,8vw,10rem)] font-black tracking-tighter text-white leading-[0.8] uppercase flex flex-col items-center"
            :class="{ 'is-revealed': revealed }">
          <div class="pointer-events-auto"><UiKineticText text="ПЕРВЫЙ" /></div>
          <div class="pointer-events-auto"><UiKineticText text="ПУЛЬС" /></div>
        </h2>
      </div>

      <!-- Текстовый блок и кнопка -->
      <div class="flex flex-col items-center max-w-2xl mt-8">
        <div class="overflow-hidden mb-12">
          <p class="reveal-item font-secondary text-[clamp(18px,1.5vw,24px)] text-white leading-relaxed pointer-events-auto"
             :class="{ 'is-revealed': revealed }" style="--reveal-delay: 180ms">
            <UiKineticText text="Великие бренды не просто существуют — они живут. Наше портфолио ждёт проект, который задаст новый ритм всей индустрии. Готовы стать нашим первым ударом сердца?" />
          </p>
        </div>

        <div class="reveal-item pointer-events-auto mt-8"
             :class="{ 'is-revealed': revealed }" style="--reveal-delay: 360ms">
          <UiButton class="magnetic-btn font-secondary !bg-transparent !text-white !border !border-white/20 hover:!border-transparent transition-all duration-300" to="#contact">
            ЗАДАТЬ РИТМ
          </UiButton>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'

defineOptions({ inheritAttrs: false })

const portfolioRef = ref<HTMLElement | null>(null)

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()
// Унифицированное появление/исчезновение контента секции
const { revealed } = useSectionReveal('[ Проекты ]')

onMounted(() => {
  // Взаимодействие со сферой (перевод OrganicCore в режим капли)
  on('section-change', (label: string) => {
    if (label === '[ Проекты ]') {
      emit('portfolio-state', true)
    } else {
      emit('portfolio-state', false)
    }
  })
})
</script>
