<template>
  <section ref="approachRef" v-bind="$attrs" class="relative h-dvh w-full flex flex-col overflow-hidden bg-transparent">
    <TechStack :is-open="showTechStack" @close="showTechStack = false" />
    
    <!-- Z-index 10: The Inversion Bar -->
    <div ref="inversionBarRef" class="absolute bottom-0 left-0 w-full h-[50%] bg-white pointer-events-none z-10 transform-gpu [clip-path:inset(0_0_1px_0)] border-b border-transparent" 
         :class="[
           isSectionActive ? 'will-change-transform' : '', 
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[1000ms] delay-0' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]"></div>

    <!-- Z-index 20: UI Контейнер -->
    <div class="absolute inset-0 w-full h-full z-20 flex flex-col pointer-events-auto" :class="showTechStack ? 'pointer-events-none' : ''">
      
      <!-- ВЕРХНЯЯ ЧАСТЬ (50%): Контент (Заголовок + Описание) в черной зоне -->
      <div class="w-full h-[50%] flex flex-col justify-end pb-8 md:pb-12 px-6 sm:px-12 md:px-16 lg:px-24 approach-content opacity-0 relative" 
           :class="[
             isMenuTransitioning ? 'transition-opacity' : '',
             isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
           ]">
        <Transition name="fade-slide" mode="out-in">
          <div :key="activeStep" class="flex flex-col relative w-full max-w-4xl">
            <!-- Фоновая цифра -->
            <div class="absolute -top-12 md:-top-24 -left-4 md:-left-8 text-[clamp(8rem,10vw,14rem)] leading-none font-primary font-black text-white/5 pointer-events-none select-none z-0">
              0{{ activeStep + 1 }}
            </div>
            
            <h2 class="font-primary text-[clamp(2rem,5vw,4.5rem)] font-black uppercase tracking-normal leading-[0.9] text-white mb-4 relative z-10 pointer-events-auto">
              <UiKineticText :text="steps[activeStep]?.title || ''" />
            </h2>
            <p class="font-secondary text-[clamp(14px,1.2vw,18px)] text-white/80 leading-relaxed font-normal relative z-10 max-w-2xl pointer-events-auto">
              <UiKineticText :text="steps[activeStep]?.description || ''" />
            </p>
          </div>
        </Transition>
      </div>

      <!-- НИЖНЯЯ ЧАСТЬ (50%): Навигация (слева) в белой зоне -->
      <div class="w-full h-[50%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 approach-nav opacity-0" 
           :class="[
             isMenuTransitioning ? 'transition-opacity' : '',
             isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
           ]">
        <div class="flex flex-col justify-center space-y-3 md:space-y-6 w-full max-w-none">
          <button 
            v-for="(step, index) in steps" 
            :key="index"
            @click="handleStepClick(index)"
            class="nav-btn relative flex items-center text-left group transition-all duration-700 w-max"
          >
            <span class="font-secondary text-[clamp(1rem,3vw,3rem)] mr-4 md:mr-8 transition-all duration-700 font-bold pointer-events-auto"
                  :class="activeStep === index ? 'text-black' : 'text-black/20 group-hover:text-black/50'">
              {{ '0' + (index + 1) }}
            </span>
            <span class="font-primary text-[clamp(2.5rem,8.5vw,12rem)] font-black uppercase tracking-normal leading-[0.85] transition-all duration-700 ease-out pointer-events-auto flex items-center"
                  :class="activeStep === index ? 'text-black translate-x-4 md:translate-x-8' : 'text-black/10 group-hover:text-black/30'">
              {{ step.shortTitle || step.title }}
              
              <!-- Arrow for 'Разработка' step -->
              <span v-if="index === 3" 
                    class="overflow-hidden inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    :class="activeStep === 3 ? 'ml-4 md:ml-6 w-10 md:w-16 opacity-100' : 'w-0 opacity-0 ml-0 group-hover:w-10 group-hover:md:w-16 group-hover:ml-4 group-hover:md:ml-6 group-hover:opacity-40'">
                <svg class="w-8 h-8 md:w-12 md:h-12 text-black transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0" 
                     :class="activeStep === 3 ? 'translate-x-0 group-hover:translate-x-2' : '-translate-x-full group-hover:translate-x-0'"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </span>
            </span>
          </button>
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
import TechStack from './TechStack.vue'

defineOptions({ inheritAttrs: false })

const approachRef = ref<HTMLElement | null>(null)
const inversionBarRef = ref<HTMLElement | null>(null)
let animTimeline: gsap.core.Timeline | null = null

const activeStep = ref(0)
const isSectionActive = ref(false)
const showTechStack = ref(false)

import { watch } from 'vue'

watch(showTechStack, (val) => {
  const content = approachRef.value?.querySelector('.approach-content')
  const nav = approachRef.value?.querySelector('.approach-nav')
  
  if (val) {
    if (content) gsap.to(content, { y: -60, opacity: 0, duration: 0.6, ease: 'power3.inOut' })
    if (nav) gsap.to(nav, { yPercent: 105, opacity: 0, duration: 0.8, ease: 'power4.inOut' })
    if (inversionBarRef.value) gsap.to(inversionBarRef.value, { yPercent: 105, duration: 0.8, ease: 'power4.inOut' })
  } else {
    if (content) gsap.to(content, { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out', delay: 0.2 })
    if (nav) gsap.to(nav, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power4.out', delay: 0.2 })
    if (inversionBarRef.value) gsap.to(inversionBarRef.value, { yPercent: 0, duration: 0.8, ease: 'power4.out', delay: 0.2 })
  }
})

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()

const steps = [
  {
    shortTitle: 'Бриф',
    title: 'Бриф & Идеи',
    description: 'ИИ агрегирует данные, анализирует нишу и формирует хаос идей в первые концепции. Человеческий разум задает вектор и отсекает шум, оставляя чистую суть проекта. Мы копаем глубоко, чтобы найти уникальный код вашего бренда.'
  },
  {
    shortTitle: 'Генерация',
    title: 'Генерация',
    description: 'Нейросети работают на полную мощность, создавая десятки вариантов архитектуры и логики. Машинное зрение проектирует сетки, а генеративные алгоритмы предлагают неординарные паттерны.'
  },
  {
    shortTitle: 'Контроль',
    title: 'Контроль',
    description: 'Арт-директор берет управление: отсекает лишнее, задает строгую форму и идеальную гармонию. Алгоритмы подчиняются вкусу и опыту. Хаос превращается в выверенный цифровой чертеж.'
  },
  {
    shortTitle: 'Разработка',
    title: 'Разработка',
    description: 'Синтез чистого кода. Форма обретает жизнь и динамику, превращаясь в поток данных. Мы используем передовые фреймворки (Vue 3, Nuxt, GSAP), чтобы оживить каждый пиксель интерфейса.'
  },
  {
    shortTitle: 'Релиз',
    title: 'Релиз',
    description: 'Идеальный, живой продукт. Дышащий проект, готовый погружать пользователей в состояние потока. Код оптимизирован, анимации плавны, а ваш бренд начинает жить по новым, цифровым правилам.'
  }
]

const triggerDistortion = (index: number) => {
  if (showTechStack.value) return
  if (activeStep.value === index) return
  emit('techstack-state', { active: false, hoveredIndex: index })
}

const clearDistortion = () => {
  if (showTechStack.value) return
  emit('techstack-state', { active: false, hoveredIndex: -1 })
}

const emitState = () => {
  emit('approach-state', { active: isSectionActive.value, step: activeStep.value })
}

const setStep = (index: number) => {
  if (index >= 0 && index < steps.length) {
    activeStep.value = index
    emitState()
  }
}

const handleStepClick = (index: number) => {
  if (index === 3 && activeStep.value === 3) {
    showTechStack.value = true
  } else {
    setStep(index)
  }
}

onMounted(() => {
  // Инициализируем анимации только после завершения прелоадера для разгрузки Main Thread
  let isInitialized = false
  
  const initGSAP = () => {
    if (isInitialized) return
    isInitialized = true
    
    animTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: approachRef.value,
        start: 'top center',
        end: 'top 20%',
        toggleActions: 'play none none reverse'
      }
    })

    const approachNav = approachRef.value?.querySelector('.approach-nav') || '.approach-nav'
    const approachContent = approachRef.value?.querySelector('.approach-content') || '.approach-content'

    animTimeline?.to(approachNav, {
      opacity: 1,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.5')
    .to(approachContent, {
      opacity: 1,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.8')
  }

  on('preloader-done', initGSAP)
  
  // Фолбэк
  setTimeout(initGSAP, 4500)

  on('section-change', (label: string) => {
    if (label === '[ Наш Подход ]') {
      isSectionActive.value = true
      emitState()
    } else {
      isSectionActive.value = false
      emitState()
    }
  })
})

onBeforeUnmount(() => {
  if (animTimeline) {
    animTimeline.scrollTrigger?.kill()
    animTimeline.kill()
  }
  ScrollTrigger.getAll().forEach(st => {
    if (st.trigger === approachRef.value) st.kill()
  })

  // Strict-Cleanup: Убиваем GSAP-анимации из watcher
  gsap.killTweensOf('.approach-content')
  gsap.killTweensOf('.approach-nav')
  if (inversionBarRef.value) gsap.killTweensOf(inversionBarRef.value)
})
</script>

<style scoped>
/* Плавные переходы для типографики в белой панели */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}
</style>
