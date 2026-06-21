<template>
  <section ref="aboutRef" v-bind="$attrs" class="relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Контейнер -->
    <div ref="contentRef" class="w-full max-w-none mx-auto z-10 relative flex flex-col md:flex-row h-full pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      
      <!-- Левая половина для логотипа (строго 50% экрана) -->
      <div class="flex items-center justify-center w-full md:w-1/2 h-full logo-container opacity-0 translate-y-8 z-20 pointer-events-none px-6 md:px-12 lg:px-20">
        <LogoKvazar class="w-[90%] lg:w-[85%] xl:w-[75%] max-w-none" />
      </div>

      <!-- Правая половина с текстом (строго 50% экрана) -->
      <div class="flex flex-col justify-center items-center text-center relative z-20 w-full md:w-1/2 h-full px-6 md:px-12 lg:px-20">
        <!-- Заголовок-тег -->
        <div class="mb-10 md:mb-16 overflow-hidden">
          <div class="about-subtitle transform translate-y-full opacity-0 font-secondary text-[clamp(12px,1vw,16px)] uppercase tracking-[0.3em] text-white/70 pointer-events-auto">
            <UiKineticText text="[ Цифровые пространства ]" />
          </div>
        </div>
        
        <!-- Текстовые блоки -->
        <div class="flex flex-col space-y-10 md:space-y-14 items-center w-[90%] lg:w-[85%] xl:w-[75%] about-text-container">
          <div class="overflow-hidden">
            <p class="about-text opacity-0 font-secondary text-[clamp(18px,1.5vw,24px)] text-white leading-relaxed pointer-events-auto">
              <UiKineticText text="Мы не просто пишем код и рисуем дизайн. Мы создаем цифровые экосистемы, в которых бренд оживает. Каждый наш проект — это живой организм, способный адаптироваться, дышать и взаимодействовать с пользователем на глубоком уровне." />
            </p>
          </div>
          <div class="overflow-hidden">
            <p class="about-text opacity-0 font-secondary text-[clamp(14px,1.2vw,18px)] text-white/70 leading-relaxed pointer-events-auto">
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

defineOptions({ inheritAttrs: false })

const aboutRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
let animTl: gsap.core.Timeline | null = null
let parallaxTrigger: ScrollTrigger | null = null

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()

onMounted(() => {
  const aboutSubtitle = aboutRef.value?.querySelector('.about-subtitle') || '.about-subtitle'
  const aboutText = aboutRef.value?.querySelectorAll('.about-text') || '.about-text'
  const logoContainer = aboutRef.value?.querySelector('.logo-container') || '.logo-container'

  // Анимация появления текста
  animTl = gsap.timeline({
    scrollTrigger: {
      trigger: aboutRef.value,
      start: 'top center',
      end: 'top 25%',
      toggleActions: 'play none none reverse'
    },
    onComplete: () => {
      // Снимаем will-change после завершения анимации, как указано в правилах
      gsap.set([logoContainer, aboutSubtitle, aboutText], { clearProps: "willChange" })
    }
  })

  animTl.to(logoContainer, {
    y: 0,
    opacity: 1,
    duration: 1.5,
    delay: 0.9,
    ease: 'power3.out',
    willChange: 'transform, opacity'
  })
  .to(aboutSubtitle, {
    y: 0,
    opacity: 1,
    duration: 1,
    ease: 'power2.out',
    willChange: 'transform, opacity'
  }, '<0.2')
  .to(aboutText, {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out',
    willChange: 'transform, opacity'
  }, '-=0.8')
  
  // Параллакс для текстовых блоков при скролле (применяем к контейнеру, чтобы не конфликтовать с y у aboutText)
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
  animTl?.scrollTrigger?.kill()
  animTl?.kill()
  parallaxTrigger?.kill()
  
  // Дополнительная очистка стилей, добавленных GSAP
  const aboutSubtitle = aboutRef.value?.querySelector('.about-subtitle')
  const aboutText = aboutRef.value?.querySelectorAll('.about-text')
  if (aboutSubtitle) gsap.set(aboutSubtitle, { clearProps: "willChange" })
  if (aboutText) gsap.set(aboutText, { clearProps: "willChange" })
  ScrollTrigger.getAll().forEach(st => {
    if (st.trigger === aboutRef.value) st.kill()
  })
})
</script>

<style scoped>
.about-text {
  transform: translateY(30px);
}
</style>
