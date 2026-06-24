<template>
  <section ref="approachRef" v-bind="$attrs" class="reveal-scope-mobile relative h-dvh w-full flex flex-col overflow-hidden bg-transparent"
           :class="[
             isMenuTransitioning ? 'transition-opacity' : '',
             isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
           ]">

    <TechStack :is-open="showTechStack" @close="showTechStack = false" />

    <!-- Белая плашка (дизайн-элемент): fixed к вьюпорту, чтобы уезжать за реальный край экрана
         независимо от скролла (иначе при скролле видно её «у шва» секции). Скользит вниз при уходе. -->
    <div ref="whitePanelRef" class="white-panel fixed bottom-0 left-0 w-full h-[55%] bg-white pointer-events-none z-10"
         :class="{ 'is-revealed': revealed }"></div>

    <!-- Унифицированный reveal-обёртка вокруг текстового контента (TechStack — отдельный оверлей, сюда не входит).
         GSAP-watcher TechStack продолжает управлять дочерними элементами независимо. -->
    <div class="reveal-item absolute inset-0 w-full h-full z-20" :class="{ 'is-revealed': revealed }">

    <!-- UI Контейнер -->
    <div class="absolute inset-0 w-full h-full flex flex-col pointer-events-auto" :class="showTechStack ? 'pointer-events-none' : ''">

      <!-- ВЕРХНЯЯ ЧАСТЬ (45%): Заголовок и описание (на черном/прозрачном фоне) -->
      <div ref="contentTopRef" class="approach-content-top w-full h-[45%] flex flex-col justify-end pb-6 px-6 relative">
        <Transition name="fade-slide" mode="out-in">
          <div :key="activeStep" class="flex flex-col relative w-full">
            <!-- Фоновая цифра (уменьшена) -->
            <div class="absolute -top-12 -left-2 text-[6rem] leading-none font-primary font-black text-white/10 pointer-events-none select-none z-0">
              0{{ activeStep + 1 }}
            </div>
            
            <h2 class="font-primary text-3xl font-black uppercase tracking-normal leading-[1.1] text-white mb-3 relative z-10 pointer-events-auto">
              {{ steps[activeStep]?.title || '' }}
            </h2>
            <p class="font-secondary text-sm text-white/80 leading-relaxed font-normal relative z-10 pointer-events-auto">
              {{ steps[activeStep]?.description || '' }}
            </p>
          </div>
        </Transition>
      </div>

      <!-- НИЖНЯЯ ЧАСТЬ (55%): Навигация в белой панели -->
      <div ref="navBottomRef" class="approach-nav-bottom w-full h-[55%] flex flex-col justify-start pt-6 px-6 z-20">
        <div class="flex flex-col space-y-4 w-full">
          <button 
            v-for="(step, index) in steps" 
            :key="index"
            @click="handleStepClick(index)"
            class="relative flex items-center text-left transition-all duration-500 w-full min-h-[2.75rem] touch-manipulation group"
          >
            <span class="font-secondary text-base transition-all duration-500 font-bold pointer-events-auto mr-4"
                  :class="activeStep === index ? 'text-black' : 'text-black/30'">
              {{ '0' + (index + 1) }}
            </span>
            <span class="font-primary text-2xl font-black uppercase tracking-normal leading-none transition-all duration-500 ease-out pointer-events-auto flex-1 flex items-center"
                  :class="activeStep === index ? 'text-black translate-x-2' : 'text-black/30'">
              {{ step.shortTitle || step.title }}
              
              <!-- Arrow for 'Разработка' step -->
              <span v-if="index === 3" 
                    class="ml-auto pointer-events-auto inline-flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    :class="activeStep === 3 ? 'w-8 opacity-100 mr-2' : 'w-0 opacity-0 mr-0'">
                <svg class="w-6 h-6 text-black transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0" 
                     :class="activeStep === 3 ? 'translate-x-0 group-active:translate-x-1' : '-translate-x-full'"
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
import TechStack from './TechStack.vue'

defineOptions({ inheritAttrs: false })

const approachRef = ref<HTMLElement | null>(null)
const whitePanelRef = ref<HTMLElement | null>(null)
const contentTopRef = ref<HTMLElement | null>(null)
const navBottomRef = ref<HTMLElement | null>(null)
const activeStep = ref(0)
const isSectionActive = ref(false)
const showTechStack = ref(false)
// Унифицированное появление/исчезновение контента секции.
// Исключение: показываем РАНО — от старта перехода (fromActive), ещё во время скролла (~1.2s),
// задолго до формирования сферы (~2.6–3.0s). Контент появляется первым, сфера дособирается следом.
const { revealed } = useSectionReveal('[ Наш Подход ]', { fromActive: true, enterDelay: 1200 })

import { watch } from 'vue'

watch(showTechStack, (val) => {
  const content = contentTopRef.value
  const nav = navBottomRef.value
  const panel = whitePanelRef.value

  if (val) {
    // Disable CSS transitions during GSAP
    if (content) (content as HTMLElement).style.transition = 'none'
    if (nav) (nav as HTMLElement).style.transition = 'none'
    if (panel) (panel as HTMLElement).style.transition = 'none'

    if (content) gsap.to(content, { y: -30, opacity: 0, duration: 0.5, ease: 'power3.inOut' })
    if (nav) gsap.to(nav, { yPercent: 105, opacity: 0, duration: 0.6, ease: 'power4.inOut' })
    if (panel) gsap.to(panel, { yPercent: 105, duration: 0.6, ease: 'power4.inOut' })
  } else {
    if (content) gsap.to(content, { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out', delay: 0.1, clearProps: 'transition' })
    if (nav) gsap.to(nav, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power4.out', delay: 0.1, clearProps: 'transition' })
    // Очищаем и transform, чтобы CSS-слайд плашки (reveal) снова перехватил управление после закрытия
    if (panel) gsap.to(panel, { yPercent: 0, duration: 0.6, ease: 'power4.out', delay: 0.1, clearProps: 'transition,transform' })
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
  gsap.killTweensOf(contentTopRef.value)
  gsap.killTweensOf(navBottomRef.value)
  gsap.killTweensOf(whitePanelRef.value)
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

.touch-manipulation {
  touch-action: none;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
