<template>
  <section ref="aboutRef" v-bind="$attrs" class="relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Логотип (Поверх сферы) -->
    <div class="absolute inset-0 w-full max-w-none mx-auto z-[50] flex flex-col md:flex-row h-full pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      <!-- Левая половина для логотипа (строго 50% экрана) -->
      <div class="reveal-item flex items-center justify-center w-full md:w-1/2 h-full logo-container pointer-events-none px-6 md:px-12 lg:px-20"
           :class="{ 'is-revealed': revealed }">
        <LogoKvazar class="w-[90%] lg:w-[85%] xl:w-[75%] max-w-none" />
      </div>
      <!-- Пустая правая половина -->
      <div class="w-full md:w-1/2 h-full hidden md:block"></div>
    </div>

    <!-- Текст (Под сферой) -->
    <div ref="contentRef" class="absolute inset-0 w-full max-w-none mx-auto z-10 flex flex-col md:flex-row h-full pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      <!-- Пустая левая половина -->
      <div class="w-full md:w-1/2 h-full hidden md:block"></div>

      <!-- Правая половина с текстом (строго 50% экрана) -->
      <div class="flex flex-col justify-center items-center text-center relative w-full md:w-1/2 h-full px-6 md:px-8 lg:px-12 xl:px-20">
        <!-- Заголовок-тег -->
        <div class="mb-10 md:mb-16">
          <div class="reveal-item font-secondary text-[clamp(12px,1vw,16px)] uppercase tracking-[0.3em] text-white/70 pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 150ms">
            <UiKineticText text="[ Цифровые пространства ]" />
          </div>
        </div>

        <!-- Текстовые блоки -->
        <div class="flex flex-col space-y-10 md:space-y-14 items-center w-[95%] md:w-[92%] lg:w-[88%] xl:w-[75%] about-text-container">
          <div>
            <p class="reveal-item font-secondary text-[clamp(16px,1.35vw,24px)] text-white leading-relaxed pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 250ms">
              <UiKineticText text="Мы не просто пишем код и рисуем дизайн. Мы создаем цифровые экосистемы, в которых бренд оживает. Каждый наш проект — это живой организм, способный адаптироваться, дышать и взаимодействовать с пользователем на глубоком уровне." />
            </p>
          </div>
          <div>
            <p class="reveal-item font-secondary text-[clamp(14px,1.2vw,18px)] text-white/70 leading-relaxed pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 350ms">
              <UiKineticText text="Отказываясь от шаблонных решений, мы используем генеративный дизайн, плавные анимации и нестандартную архитектуру. Наша цель — погрузить пользователя в состояние потока с первых секунд." />
            </p>
          </div>
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
import { useSectionReveal } from '~/composables/useSectionReveal'

defineOptions({ inheritAttrs: false })

const aboutRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
let parallaxTrigger: ScrollTrigger | null = null

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()
// Унифицированное появление/исчезновение контента секции
const { revealed } = useSectionReveal('[ О нас ]')

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)

  // Декоративный параллакс текстового блока при скролле (на контейнере — композится с reveal дочерних)
  const textContainer = aboutRef.value?.querySelector('.about-text-container')
  if (textContainer) {
    const parallaxAnim = gsap.to(textContainer, {
      y: -50,
      ease: 'none',
      scrollTrigger: {
        trigger: aboutRef.value,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    })
    parallaxTrigger = parallaxAnim.scrollTrigger ?? null
  }

  // Взаимодействие со сферой
  on('section-change', (label: string) => {
    if (label === '[ О нас ]') {
      emit('about-state', true)
    } else {
      emit('about-state', false)
    }
  })
})

onBeforeUnmount(() => {
  parallaxTrigger?.kill()
  ScrollTrigger.getAll().forEach(st => {
    if (st.trigger === aboutRef.value) st.kill()
  })
})
</script>
