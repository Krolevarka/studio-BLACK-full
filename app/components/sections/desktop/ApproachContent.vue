<template>
  <section ref="approachRef" v-bind="$attrs" class="relative h-dvh w-full flex flex-col overflow-hidden bg-transparent">
    <TechStack :is-open="showTechStack" @close="showTechStack = false" />

    <!-- Белая плашка (дизайн-элемент): fixed к вьюпорту, чтобы уезжать за реальный край экрана
         независимо от скролла. Внешняя обёртка — меню-затухание (opacity), внутренняя — слайд (transform). -->
    <div class="fixed bottom-0 left-0 w-full h-[50%] z-10 pointer-events-none"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[1000ms] delay-0' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      <div ref="inversionBarRef" class="white-panel w-full h-full bg-white [clip-path:inset(0_0_1px_0)] border-b border-transparent"
           :class="{ 'is-revealed': revealed }"></div>
    </div>

    <!-- Унифицированный reveal-обёртка вокруг текстового контента (TechStack — отдельный оверлей, сюда не входит).
         GSAP-watcher TechStack продолжает управлять дочерними элементами независимо. -->
    <div class="reveal-item absolute inset-0 w-full h-full z-20" :class="{ 'is-revealed': revealed }">

    <!-- UI Контейнер -->
    <div class="absolute inset-0 w-full h-full flex flex-col pointer-events-auto" :class="showTechStack ? 'pointer-events-none' : ''">

      <!-- ВЕРХНЯЯ ЧАСТЬ (50%): Контент (Заголовок + Описание) в черной зоне -->
      <div class="w-full h-[50%] flex flex-col justify-end pb-8 md:pb-12 px-6 sm:px-12 md:px-16 lg:px-24 approach-content relative"
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
      <div class="w-full h-[50%] flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 approach-nav"
           :class="[
             isMenuTransitioning ? 'transition-opacity' : '',
             isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
           ]">
        <div class="flex flex-col justify-between h-full py-6 md:py-10 w-full max-w-none">
          <button 
            v-for="(step, index) in steps" 
            :key="index"
            @click="handleStepClick(index)"
            class="nav-btn relative flex items-center text-left group transition-all duration-700 w-max"
          >
            <span class="font-secondary text-[clamp(1rem,2dvh,3rem)] mr-4 md:mr-8 transition-all duration-700 font-bold pointer-events-auto"
                  :class="activeStep === index ? 'text-black' : 'text-black/20 group-hover:text-black/50'">
              {{ '0' + (index + 1) }}
            </span>
            <span class="font-primary text-[clamp(2rem,7dvh,9rem)] font-black uppercase tracking-normal leading-[0.85] transition-all duration-700 ease-out pointer-events-auto flex items-center"
                  :class="activeStep === index ? 'text-black translate-x-4 md:translate-x-8' : 'text-black/10 group-hover:text-black/30'">
              {{ step.shortTitle || step.title }}
              
              <!-- Arrow for 'Разработка' step -->
              <span v-if="index === 3" 
                    class="overflow-hidden inline-flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    :class="activeStep === 3 ? 'ml-4 md:ml-6 w-10 md:w-14 opacity-100' : 'w-0 opacity-0 ml-0 group-hover:w-10 group-hover:md:w-14 group-hover:ml-4 group-hover:md:ml-6 group-hover:opacity-40'">
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'
import { ANIMATION_TIMINGS } from '~/utils/animation.config'
import TechStack from './TechStack.vue'

defineOptions({ inheritAttrs: false })

const approachRef = ref<HTMLElement | null>(null)
const inversionBarRef = ref<HTMLElement | null>(null)

const activeStep = ref(0)
const isSectionActive = ref(false)
const showTechStack = ref(false)
// Унифицированное появление/исчезновение контента секции.
// Исключение: показываем РАНО — от старта перехода (fromActive), ещё во время скролла (~1.2s),
// задолго до формирования сферы (~2.6–3.0s). Контент появляется первым, сфера дособирается следом.
const { revealed } = useSectionReveal('[ Наш Подход ]', { fromActive: true, enterDelay: ANIMATION_TIMINGS.ui.sectionRevealDelay })

import { watch } from 'vue'

watch(showTechStack, (val) => {
  const content = approachRef.value?.querySelector('.approach-content')
  const nav = approachRef.value?.querySelector('.approach-nav')
  
  if (val) {
    // Отключаем CSS-слайд плашки на время GSAP, чтобы переходы не конфликтовали
    if (inversionBarRef.value) inversionBarRef.value.style.transition = 'none'
    if (content) gsap.to(content, { y: -60, opacity: 0, duration: 0.6, ease: 'power3.inOut' })
    if (nav) gsap.to(nav, { yPercent: 105, opacity: 0, duration: 0.8, ease: 'power4.inOut' })
    if (inversionBarRef.value) gsap.to(inversionBarRef.value, { yPercent: 105, duration: 0.8, ease: 'power4.inOut' })
  } else {
    if (content) gsap.to(content, { y: 0, opacity: 1, duration: 0.8, ease: 'power4.out', delay: 0.2 })
    if (nav) gsap.to(nav, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power4.out', delay: 0.2 })
    // Очищаем transform/transition, чтобы CSS-слайд плашки (reveal) снова перехватил управление
    if (inversionBarRef.value) gsap.to(inversionBarRef.value, { yPercent: 0, duration: 0.8, ease: 'power4.out', delay: 0.2, clearProps: 'transition,transform' })
  }
})

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()

import { steps } from '~/data/approachSteps'

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
  // Strict-Cleanup: Убиваем GSAP-анимации из watcher
  gsap.killTweensOf('.approach-content')
  gsap.killTweensOf('.approach-nav')
  if (inversionBarRef.value) gsap.killTweensOf(inversionBarRef.value)
})
</script>

<style scoped>
/* Белая плашка: уезжает полностью за кадр (110%) БЫСТРО (~420ms) и с ускорением — успевает уйти,
   пока скролл ещё практически не сдвинулся (easeInOutCubic, медленный старт), поэтому пользователь
   не видит её «трансформацию» на фоне уезжающей секции. Вход (выезд снизу) — плавный с замедлением. */
.white-panel {
  transform: translateY(110%);
  transition: transform 420ms cubic-bezier(0.4, 0, 1, 1);
  will-change: transform;
}
.white-panel.is-revealed {
  transform: translateY(0);
  transition: transform var(--reveal-dur-in) var(--reveal-ease-in);
}
@media (prefers-reduced-motion: reduce) {
  .white-panel,
  .white-panel.is-revealed {
    transition-duration: 1ms;
  }
}

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
