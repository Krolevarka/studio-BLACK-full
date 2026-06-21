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
const sectionLabels = ['[ Студия ]', '[ О нас ]', '[ Наш Подход ]', '[ Проекты ]', '[ Прайс ]', '[ Контакты ]']
let currentIndex = 0
const isAnimating = useState('isAnimating', () => false)
const loadAbout = ref(false)
const loadApproach = ref(false)
const loadPortfolio = ref(false)
const loadPrice = ref(false)
const loadContact = ref(false)
let isMenuOpen = false
let isTechStackOpen = false
let observerInstance: Observer | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null
let menuObserverTimer: ReturnType<typeof setTimeout> | null = null
let globalFocusOutAlign: ((e: FocusEvent) => void) | null = null

const { on, emit } = useEventBus()
const { isPreloading } = useOrganicCore()
const { isMobileOrTablet } = useDeviceSwitch()

const gotoSection = (index: number, direction: number) => {
  if (isAnimating.value || isMenuOpen || isPreloading.value || isTechStackOpen) return
  const isHeavyDrag = useState('isHeavyDrag', () => false)
  if (isHeavyDrag.value) return // Блокируем свайпы и скролл во время перетаскивания сфер!
  
  // Проверяем границы
  if (index < 0 || index >= sections.length) return

  // Избегаем зависания Lenis, если пытаемся скроллить к текущей секции
  if (index === currentIndex) return

  isAnimating.value = true
  currentIndex = index

  emit('section-change', sectionLabels[currentIndex])

  // Запускаем плавный скролл через Lenis
  if ($lenis) {
    const target = sections[currentIndex]!

    // FAILSAFE: гарантированная разблокировка скролла, если Lenis прервёт анимацию
    // из-за изменения layout'a (например, при анимации элементов Approach)
    if (scrollTimer) clearTimeout(scrollTimer)
    const failsafeTimer = setTimeout(() => {
      isAnimating.value = false
      if ($lenis && typeof $lenis.start === 'function') $lenis.start()
    }, 2500)

    $lenis.scrollTo(target, {
      duration: 2.0,
      easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, // Плавный easeInOutCubic без рывка в конце
      lock: true, // Блокируем другие попытки скролла на время анимации
      onComplete: () => {
        clearTimeout(failsafeTimer)
        if (scrollTimer) clearTimeout(scrollTimer)
        scrollTimer = setTimeout(() => {
          isAnimating.value = false
        }, 200)
      }
    })
  } else {
    isAnimating.value = false
  }
}

onMounted(() => {
  gsap.registerPlugin(Observer)

  emit('section-change', sectionLabels[currentIndex])

  // Каскадная гидратация под прикрытием прелоадера
  setTimeout(() => { loadAbout.value = true }, 500)
  setTimeout(() => { loadApproach.value = true }, 1200)
  setTimeout(() => { loadPortfolio.value = true }, 1900)
  setTimeout(() => { loadPrice.value = true }, 2600)
  setTimeout(() => { loadContact.value = true }, 3300)

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
        if (!isMenuOpen && observerInstance) observerInstance.enable()
      }, 1200)
    }
  })

  on('techstack-state', (state: { active: boolean }) => {
    isTechStackOpen = state.active
  })

  // Останавливаем стандартную реакцию Lenis и нативный скролл, чтобы они не конфликтовали с Observer
  if ($lenis) {
    // Временно выключаем реакцию Lenis на пользовательские события (но scrollTo будет работать)
    // Лучше всего перехватывать все события через Observer
  }

  observerInstance = Observer.create({
    target: window,
    type: 'wheel,touch', // отслеживаем только колесо мыши и тач-события на мобильных
    tolerance: isMobileOrTablet.value ? 80 : 50, // Больший порог для свайпов на touch
    preventDefault: true, // БЛОКИРУЕМ стандартный скролл
    ignore: '.no-swipe, input, textarea, select, button, a, [data-lenis-prevent]', // Игнорируем элементы, которые должны обрабатывать тапы/свайпы сами
    onUp: () => gotoSection(currentIndex - 1, -1),   // Скролл/свайп вверх -> ПРЕДЫДУЩИЙ экран
    onDown: () => gotoSection(currentIndex + 1, 1), // Скролл/свайп вниз -> СЛЕДУЮЩИЙ экран
  })

  // Слушаем события из навигации (например, по клику в меню)
  on('nav-goto', (targetHref: string) => {
    // Находим индекс по href (например, '#about' -> '#section-about')
    const targetId = targetHref.replace('#', '#section-')
    const index = sections.indexOf(targetId)
    if (index !== -1) {
      gotoSection(index, index > currentIndex ? 1 : -1)
    } else {
      // Фолбэк, если ID не в массиве (например #contact, если он где-то в футере)
      if ($lenis) {
        $lenis.scrollTo(targetHref, { 
          duration: 2.0, 
          easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 
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
})

onBeforeUnmount(() => {
  if (scrollTimer) clearTimeout(scrollTimer)
  if (menuObserverTimer) clearTimeout(menuObserverTimer)
  if (observerInstance) observerInstance.kill()
  if (typeof window !== 'undefined' && globalFocusOutAlign) {
    window.removeEventListener('focusout', globalFocusOutAlign)
    globalFocusOutAlign = null
  }
})
</script>

<style scoped>
.snap-section {
  position: relative;
  overflow: hidden;
}
</style>
