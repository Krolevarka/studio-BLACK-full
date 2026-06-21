<template>
  <section ref="heroRef" v-bind="$attrs" class="snap-section relative h-dvh w-full overflow-hidden bg-transparent flex flex-col justify-center items-center">
    
    <!-- Текстовый контент -->
    <div ref="contentRef" class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 mix-blend-difference pointer-events-none" 
         style="will-change: filter, transform; transform: translateZ(0);"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      
      <!-- Брутальный заголовок -->
      <div role="heading" aria-level="1" class="font-primary text-[clamp(2.5rem,6vw,7rem)] font-bold tracking-tighter text-white leading-[0.9] mb-6 flex flex-col">
        <div class="overflow-hidden pointer-events-auto">
          <UiKineticText class="hero-text-line block transform translate-y-full opacity-0" text="СИЛЬНЫЕ" />
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <UiKineticText class="hero-text-line block transform translate-y-full opacity-0" text="ЦИФРОВЫЕ" />
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <UiKineticText class="hero-text-line block transform translate-y-full opacity-0" text="РЕШЕНИЯ" />
        </div>
      </div>
      
      <p class="hero-subtitle opacity-0 font-secondary text-[clamp(12px,1vw,16px)] uppercase tracking-[0.3em] text-white/80 max-w-lg mb-12 pointer-events-auto">
        <UiKineticText text="Проектирование и разработка сайтов премиального уровня." />
      </p>
      
      <div class="hero-btn opacity-0 pointer-events-auto">
        <!-- Кнопка прозрачная. При наведении курсор (белый blob) становится её фоном. -->
        <UiButton class="magnetic-btn font-secondary !bg-transparent !text-white !border !border-white/20 hover:!border-transparent transition-all duration-300" to="#contact">
          Обсудить проект
        </UiButton>
      </div>

    </div>

    <!-- Подсказка скролла -->
    <div class="hero-scroll-hint-wrapper absolute bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 mix-blend-difference z-20 pointer-events-none"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      <UiScrollHint class="hero-scroll-hint opacity-0" />
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

const heroRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// Для очистки событий
let isPreloaderDone = false
let heroParallaxTrigger: ScrollTrigger | null = null
let preloaderTimer: ReturnType<typeof setTimeout> | null = null
let entranceTimeline: gsap.core.Timeline | null = null

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { on } = useEventBus()

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)
  // 1. Анимация появления после завершения Preloader
  const handlePreloaderDone = () => {
    if (isPreloaderDone) return
    isPreloaderDone = true

    const heroLines = heroRef.value?.querySelectorAll('.hero-text-line') || '.hero-text-line'
    const heroSubtitle = heroRef.value?.querySelector('.hero-subtitle') || '.hero-subtitle'
    const heroBtn = heroRef.value?.querySelector('.hero-btn') || '.hero-btn'
    const scrollHint = heroRef.value?.querySelector('.hero-scroll-hint') || '.hero-scroll-hint'

    entranceTimeline = gsap.timeline({
      onComplete: () => {
        gsap.set(heroLines, { clearProps: "willChange" })
      }
    })

    // Анимация текста (вырастание снизу)
    entranceTimeline.to(heroLines, {
      y: 0,
      opacity: 1,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power4.out',
      willChange: 'transform, opacity'
    })
    .to(heroSubtitle, {
      opacity: 1,
      y: -10,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.8')
    .to(heroBtn, {
      opacity: 1,
      y: -10,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.8')
    .to(scrollHint, {
      opacity: 1,
      y: -10,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.6')
    // 3. ScrollTrigger (отложенная инициализация)
    if (heroRef.value && contentRef.value) {
      const anim = gsap.to(contentRef.value, {
        y: -200,
        opacity: 0,
        filter: 'blur(10px)',
        scrollTrigger: {
          trigger: heroRef.value,
          start: 'top top',
          end: 'center top',
          scrub: true,
        }
      })
      heroParallaxTrigger = anim.scrollTrigger ?? null

      const scrollHintWrapper = heroRef.value.querySelector('.hero-scroll-hint-wrapper')
      if (scrollHintWrapper) {
        const hintTrig = ScrollTrigger.create({
          trigger: heroRef.value,
          start: 'top top',
          onUpdate: (self) => {
            if (self.scroll() > 50) {
              gsap.to(scrollHintWrapper, { opacity: 0, y: 15, duration: 1.5, ease: 'power2.out' });
              hintTrig.kill()
            }
          }
        })
      }
    }
  }

  on('preloader-done', handlePreloaderDone)
  
  // Если прелоадера нет или он быстро прошел
  preloaderTimer = setTimeout(handlePreloaderDone, 4500) // фоллбэк
})

onBeforeUnmount(() => {
  if (preloaderTimer) clearTimeout(preloaderTimer)
  entranceTimeline?.kill()
  heroParallaxTrigger?.kill()
  ScrollTrigger.getAll().forEach(st => {
    // We only kill triggers associated with this component, handled by heroParallaxTrigger?.kill()
    // but just to be safe if there are others attached to our elements.
    if (st.trigger === heroRef.value) st.kill()
  })
})
</script>
