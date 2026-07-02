<template>
  <div ref="pageRef" class="flex flex-col w-full relative" :class="{'pointer-events-none': isAnimating}">
    <!-- SECTIONS -->
    <SectionsSectionHero id="section-hero" class="snap-section w-full h-svh" />
    <LazySectionsSectionAbout v-if="loadAbout" id="section-about" class="snap-section w-full h-svh" />
    <LazySectionsSectionApproach v-if="loadApproach" id="section-approach" class="snap-section w-full h-svh" />
    <LazySectionsSectionPortfolio v-if="loadPortfolio" id="section-portfolio" class="snap-section w-full h-svh" />
    <LazySectionsSectionPrice v-if="loadPrice" id="section-price" class="snap-section w-full h-svh" />
    <LazySectionsSectionContact v-if="loadContact" id="section-contact" class="snap-section w-full h-svh" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useHead, useNuxtApp } from '#imports'
import gsap from 'gsap'
import { Observer } from 'gsap/Observer'
import { useEventBus } from '~/composables/useEventBus'
import { useDeviceSwitch } from '~/composables/useDeviceSwitch'
import { ANIMATION_TIMINGS } from '~/utils/animation.config'
import { useSectionTransition, HERO_LABEL } from '~/composables/useSectionTransition'
import { SECTION_LABELS } from '~/utils/sectionLabels'

useHead({
  title: 'studio-BLACK',
  meta: [
    { name: 'description', content: 'Органический код. Плавный дизайн.' },
  ]
})

const { $lenis } = useNuxtApp()
const pageRef = ref<HTMLElement | null>(null)

// Массив ID секций для навигации
const sections = ['#section-hero', '#section-about', '#section-approach', '#section-portfolio', '#section-price', '#section-contact']
const sectionLabels = SECTION_LABELS
let currentIndex = 0
const isAnimating = useState('isAnimating', () => false)
const loadAbout = ref(false)
const loadApproach = ref(false)
const loadPortfolio = ref(false)
const loadPrice = ref(false)
const loadContact = ref(false)
let isMenuOpen = false
let isTechStackOpen = false
let isPriceModalOpen = false
let wheelObserverInstance: Observer | null = null
let touchObserverInstance: Observer | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null
let menuObserverTimer: ReturnType<typeof setTimeout> | null = null
let preloaderFallbackTimer: ReturnType<typeof setTimeout> | null = null
let globalFocusOutAlign: ((e: FocusEvent) => void) | null = null
let globalKeyDownNav: ((e: KeyboardEvent) => void) | null = null

const { on, emit } = useEventBus()
const { isPreloading } = useOrganicCore()
const { isMobileOrTablet } = useDeviceSwitch()
const { activeLabel, arrivedLabel } = useSectionTransition()

const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

const gotoSection = (index: number) => {
  if (isAnimating.value || isMenuOpen || isPreloading.value || isTechStackOpen || isPriceModalOpen) return
  const isHeavyDrag = useState('isHeavyDrag', () => false)
  if (isHeavyDrag.value) return // Блокируем свайпы и скролл во время перетаскивания сфер!
  
  // Проверяем границы
  if (index < 0 || index >= sections.length) return

  // Избегаем зависания Lenis, если пытаемся скроллить к текущей секции
  if (index === currentIndex) return

  isAnimating.value = true
  currentIndex = index

  emit('section-change', sectionLabels[currentIndex])

  // ПОСЛЕДОВАТЕЛЬНЫЙ ТАЙМИНГ, фаза 1: на старте скролла помечаем новую секцию активной.
  // Старая секция (activeLabel != её метки) сразу начинает плавно исчезать.
  activeLabel.value = sectionLabels[currentIndex]!

  // Запускаем плавный скролл через Lenis
  if ($lenis) {
    const target = sections[currentIndex]!

    // FAILSAFE: гарантированная разблокировка скролла, если Lenis прервёт анимацию
    // из-за изменения layout'a (например, при анимации элементов Approach)
    if (scrollTimer) clearTimeout(scrollTimer)
    const failsafeTimer = setTimeout(() => {
      isAnimating.value = false
      // Даже если Lenis прервался — раскрываем прибывшую секцию, чтобы контент не остался скрытым
      arrivedLabel.value = sectionLabels[currentIndex]!
      if ($lenis && typeof $lenis.start === 'function') $lenis.start()
    }, ANIMATION_TIMINGS.ui.pageIntroDelay)

    $lenis.scrollTo(target, {
      // На телефоне плавный переход за 0.75с с мягким easeInOutQuad, чтобы скролл был шелковистым и без рывков
      duration: isMobileOrTablet.value ? 0.75 : 2.0,
      easing: isMobileOrTablet.value ? easeInOutQuad : easeInOutCubic,
      lock: true, // Блокируем другие попытки скролла на время анимации
      onComplete: () => {
        clearTimeout(failsafeTimer)
        // ПОСЛЕДОВАТЕЛЬНЫЙ ТАЙМИНГ, фаза 2: по прибытии раскрываем новую секцию (каскад появления)
        arrivedLabel.value = sectionLabels[currentIndex]!
        if (scrollTimer) clearTimeout(scrollTimer)
        scrollTimer = setTimeout(() => {
          isAnimating.value = false
        }, 200)
      }
    })
  } else {
    arrivedLabel.value = sectionLabels[currentIndex]!
    isAnimating.value = false
  }
}

onMounted(() => {
  gsap.registerPlugin(Observer)

  emit('section-change', sectionLabels[currentIndex])

  // Первый показ Hero завязан на прелоадер: arrivedLabel пуст до его завершения,
  // поэтому контент Hero проявляется только после preloader-done (с фолбэком на случай сбоя).
  const revealHero = () => {
    if (arrivedLabel.value === '') arrivedLabel.value = HERO_LABEL
  }
  on('preloader-done', revealHero)
  preloaderFallbackTimer = setTimeout(revealHero, 4500)

  // Каскадная гидратация под прикрытием прелоадера
  const rIC = (cb: () => void, delay: number) => {
    if (typeof requestIdleCallback === 'function') {
      setTimeout(() => requestIdleCallback(cb, { timeout: 2000 }), delay)
    } else {
      setTimeout(cb, delay)
    }
  }

  rIC(() => { loadAbout.value = true }, 500)
  rIC(() => { loadApproach.value = true }, 1200)
  rIC(() => { loadPortfolio.value = true }, 1900)
  rIC(() => { loadPrice.value = true }, 2600)
  rIC(() => { loadContact.value = true }, 3300)

  on('menu-state', (isOpen: boolean) => {
    isMenuOpen = isOpen
    if (isOpen) {
      if (menuObserverTimer) clearTimeout(menuObserverTimer)
      // ВАЖНО: Мы НЕ отключаем Observer, чтобы он продолжал делать e.preventDefault() 
      // и не давал пользователю крутить нативный скролл. 
      // Сама смена секций заблокирована в gotoSection через проверку isMenuOpen.
    } else {
      if (menuObserverTimer) clearTimeout(menuObserverTimer)
      menuObserverTimer = setTimeout(() => {
        if (!isMenuOpen) {
          if (wheelObserverInstance) wheelObserverInstance.enable()
          if (touchObserverInstance) touchObserverInstance.enable()
        }
      }, ANIMATION_TIMINGS.ui.menuTransition)
    }
  })

  on('techstack-state', (state: { active: boolean }) => {
    isTechStackOpen = state.active
  })

  on('price-modal-state', (state: { active: boolean }) => {
    isPriceModalOpen = state.active
  })

  // Останавливаем стандартную реакцию Lenis и нативный скролл, чтобы они не конфликтовали с Observer
  wheelObserverInstance = Observer.create({
    target: window,
    type: 'wheel',
    tolerance: 50,
    preventDefault: true,
    ignore: '.no-swipe, .no-swipe *, [data-lenis-prevent], [data-lenis-prevent] *, input, textarea, select',
    onUp: () => gotoSection(currentIndex - 1),   // Колесо мыши вверх -> ПРЕДЫДУЩИЙ экран
    onDown: () => gotoSection(currentIndex + 1), // Колесо мыши вниз -> СЛЕДУЮЩИЙ экран
  })

  touchObserverInstance = Observer.create({
    target: window,
    type: 'touch',
    tolerance: 80, // Больший порог для свайпов на touch
    preventDefault: true,
    ignore: '.no-swipe, .no-swipe *, [data-lenis-prevent], [data-lenis-prevent] *, input, textarea, select',
    onUp: () => gotoSection(currentIndex + 1),   // Свайп пальцем вверх -> СЛЕДУЮЩИЙ экран (естественный скролл вниз)
    onDown: () => gotoSection(currentIndex - 1), // Свайп пальцем вниз -> ПРЕДЫДУЩИЙ экран (естественный скролл вверх)
  })

  // Слушаем события из навигации (например, по клику в меню)
  on('nav-goto', (targetHref: string) => {
    // Находим индекс по href (например, '#about' -> '#section-about')
    const targetId = targetHref.replace('#', '#section-')
    const index = sections.indexOf(targetId)
    if (index !== -1) {
      gotoSection(index)
    } else {
      // Фолбэк, если ID не в массиве (например #contact, если он где-то в футере)
      if ($lenis) {
        isAnimating.value = true
        $lenis.scrollTo(targetHref, { 
          duration: isMobileOrTablet.value ? 0.75 : 2.0, 
          easing: isMobileOrTablet.value ? easeInOutQuad : easeInOutCubic,
          onComplete: () => {
            isAnimating.value = false
          }
        })
      }
    }
  })

  // Защита от нативного скролла при закрытии мобильной клавиатуры
  const onFocusOut = (e: FocusEvent) => {
    const target = e.target as HTMLElement
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      setTimeout(() => {
        if ($lenis && !isAnimating.value && !isMenuOpen) {
           $lenis.scrollTo(sections[currentIndex]!, { duration: 0.6, lock: true })
        }
      }, 150)
    }
  }
  window.addEventListener('focusout', onFocusOut)
  globalFocusOutAlign = onFocusOut

  // Навигация пробелом (Space -> следующая секция, Shift + Space -> предыдущая секция)
  const onKeyDownNav = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      const target = e.target as HTMLElement
      if (target) {
        const isTextInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable
        const isButton = target.tagName === 'BUTTON' || target.getAttribute('role') === 'button'
        
        // Если фокус в инпуте (ввод пробела) или на кнопке (нажатие кнопки) — не перехватываем
        if (!isTextInput && !isButton) {
          e.preventDefault()
          const dir = e.shiftKey ? -1 : 1
          gotoSection(currentIndex + dir)
        }
      }
    }
  }
  window.addEventListener('keydown', onKeyDownNav)
  globalKeyDownNav = onKeyDownNav
})

onBeforeUnmount(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
  if (menuObserverTimer) clearTimeout(menuObserverTimer)
  if (preloaderFallbackTimer) clearTimeout(preloaderFallbackTimer)
  if (wheelObserverInstance) wheelObserverInstance.kill()
  if (touchObserverInstance) touchObserverInstance.kill()
  if (typeof window !== 'undefined' && globalFocusOutAlign) {
    window.removeEventListener('focusout', globalFocusOutAlign)
    globalFocusOutAlign = null
  }
  if (typeof window !== 'undefined' && globalKeyDownNav) {
    window.removeEventListener('keydown', globalKeyDownNav)
    globalKeyDownNav = null
  }
})
</script>

<style scoped>
.snap-section {
  position: relative;
  overflow: hidden;
}
</style>
