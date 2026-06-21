<template>
  <section ref="portfolioRef" v-bind="$attrs" class="relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Контейнер -->
    <div ref="contentRef" class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 h-full pointer-events-none mix-blend-difference"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      
      <!-- Заголовок поверх капли (анимация без маски, чтобы буква Й не обрезалась) -->
      <div class="mb-12">
        <h2 class="portfolio-title opacity-0 transform translate-y-24 font-primary text-[clamp(3rem,8vw,10rem)] font-black tracking-tighter text-white leading-[0.8] uppercase flex flex-col items-center">
          <div class="pointer-events-auto"><UiKineticText text="ПЕРВЫЙ" /></div>
          <div class="pointer-events-auto"><UiKineticText text="ПУЛЬС" /></div>
        </h2>
      </div>
      
      <!-- Текстовый блок и кнопка -->
      <div class="flex flex-col items-center max-w-2xl mt-8">
        <div class="overflow-hidden mb-12">
          <p class="portfolio-text opacity-0 font-secondary text-[clamp(18px,1.5vw,24px)] text-white leading-relaxed pointer-events-auto">
            <UiKineticText text="Великие бренды не просто существуют — они живут. Наше портфолио ждёт проект, который задаст новый ритм всей индустрии. Готовы стать нашим первым ударом сердца?" />
          </p>
        </div>
        
        <div class="portfolio-btn opacity-0 pointer-events-auto mt-8">
          <UiButton class="magnetic-btn font-secondary !bg-transparent !text-white !border !border-white/20 hover:!border-transparent transition-all duration-300" to="#contact">
            ЗАДАТЬ РИТМ
          </UiButton>
        </div>
      </div>
      
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'

defineOptions({ inheritAttrs: false })

const portfolioRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
let animTimeline: gsap.core.Timeline | null = null

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()

onMounted(() => {
  // Анимация появления контента
  animTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: portfolioRef.value,
      start: 'top center',
      end: 'top 25%',
      toggleActions: 'play none none reverse'
    }
  })

  const portfolioTitle = portfolioRef.value?.querySelector('.portfolio-title') || '.portfolio-title'
  const portfolioText = portfolioRef.value?.querySelector('.portfolio-text') || '.portfolio-text'
  const portfolioBtn = portfolioRef.value?.querySelector('.portfolio-btn') || '.portfolio-btn'

  animTimeline?.to(portfolioTitle, {
    y: 0,
    opacity: 1,
    duration: 1.5,
    delay: 0.6,
    ease: 'power4.out'
  })
  .to(portfolioText, {
    opacity: 1,
    y: -10,
    duration: 1,
    ease: 'power3.out'
  }, '-=1')
  .to(portfolioBtn, {
    opacity: 1,
    y: -10,
    duration: 1,
    ease: 'power2.out'
  }, '-=0.8')
  
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
  if (animTimeline) {
    animTimeline.scrollTrigger?.kill()
    animTimeline.kill()
  }
  ScrollTrigger.getAll().forEach(st => {
    if (st.trigger === portfolioRef.value) st.kill()
  })
})
</script>

<style scoped>
.portfolio-text {
  transform: translateY(30px);
}
</style>
