<template>
  <section ref="heroRef" v-bind="$attrs" class="snap-section relative h-dvh w-full overflow-hidden bg-transparent flex flex-col justify-center items-center">
    
    <!-- Текстовый контент -->
    <div ref="contentRef" class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 mix-blend-difference transform-gpu pointer-events-none" 
         style="will-change: filter, transform; transform: translateZ(0);"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      
      <!-- Брутальный заголовок -->
      <div role="heading" aria-level="1" class="font-primary text-[clamp(2.5rem,6vw,7rem)] font-bold tracking-tighter text-white leading-[0.9] mb-6 flex flex-col">
        <div class="overflow-hidden pointer-events-auto">
          <UiKineticText class="reveal-item block" :class="{ 'is-revealed': revealed }" text="СИЛЬНЫЕ" />
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <UiKineticText class="reveal-item block" :class="{ 'is-revealed': revealed }" style="--reveal-delay: 120ms" text="ЦИФРОВЫЕ" />
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <UiKineticText class="reveal-item block" :class="{ 'is-revealed': revealed }" style="--reveal-delay: 240ms" text="РЕШЕНИЯ" />
        </div>
      </div>

      <p class="reveal-item font-secondary text-[clamp(12px,1vw,16px)] uppercase tracking-[0.3em] text-white/80 max-w-lg mb-12 pointer-events-auto"
         :class="{ 'is-revealed': revealed }" style="--reveal-delay: 300ms">
        <UiKineticText text="Проектирование и разработка сайтов премиального уровня." />
      </p>

      <div class="reveal-item pointer-events-auto"
           :class="{ 'is-revealed': revealed }" style="--reveal-delay: 360ms">
        <!-- Кнопка прозрачная. При наведении курсор (белый blob) становится её фоном. -->
        <UiButton class="magnetic-btn font-secondary !bg-transparent !text-white !border !border-white/20 hover:!border-transparent transition-all duration-300" to="#contact">
          Обсудить проект
        </UiButton>
      </div>

    </div>

    <!-- Подсказка скролла (меню-затухание на обёртке, унифицированный reveal — на внутреннем элементе) -->
    <div class="hero-scroll-hint-wrapper absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 mix-blend-difference transform-gpu z-20 pointer-events-none"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      <UiScrollHint class="reveal-item" :class="{ 'is-revealed': revealed && !hasScrolled }" style="--reveal-delay: 420ms" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'

defineOptions({ inheritAttrs: false })

const heroRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const hasScrolled = ref(false)

const handleScroll = () => {
  if (window.scrollY > 50) {
    hasScrolled.value = true
    window.removeEventListener('scroll', handleScroll)
  }
}

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
// Унифицированное появление контента (первый показ гейтится прелоадером через arrivedLabel в index.vue)
const { revealed } = useSectionReveal('[ Студия ]')

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
