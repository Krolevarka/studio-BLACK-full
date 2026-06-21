<template>
  <div ref="layoutRef" class="relative w-full min-h-dvh selection:bg-black selection:text-white bg-[#050505] overflow-x-hidden">
    
    <!-- ГЛОБАЛЬНАЯ ШАПКА С КНОПКОЙ МЕНЮ -->
    <DeviceSwitch 
      :desktop="DesktopLayoutHeader"
      :mobile="MobileLayoutHeader"
      :isPreloading="isPreloading"
      :isMenuOpen="isMenuOpen"
      :isMenuAnimating="isMenuAnimating"
      :currentMenuLabel="currentMenuLabel"
      :isContactTyping="isContactTyping"
      :isTechStackOpen="isTechStackOpen"
      @logo-click="handleLogoClick"
      @toggle-menu="isMenuOpen ? closeMenu() : openMenu()"
    />

    <!-- ГЛОБАЛЬНАЯ СФЕРА (Organic Core) -->
    <div 
      class="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0"
    >
      <OrganicCore ref="globalCoreRef" />
    </div>

    <!-- НОВОЕ ФИЗИЧЕСКОЕ МЕНЮ (Поверх всего) -->
    <DeviceSwitch 
      :desktop="DesktopPhysicsMenu"
      :mobile="MobileMenu"
      :isOpen="isMenuOpen" 
      :items="menuItems" 
      @navigate="handleMenuClick" 
    />

    <!-- КАСТОМНЫЙ КУРСОР -->
    <ClientOnly>
      <UiCursor v-if="needsCursor" />
    </ClientOnly>

    <!-- ОСНОВНОЙ КОНТЕНТ -->
    <main 
      ref="mainRef" 
      class="relative w-full min-h-dvh bg-transparent"
      :class="isMenuOpen ? 'pointer-events-none' : 'pointer-events-auto'"
    >
      <slot />
    </main>

    <!-- СЕМАНТИЧЕСКИЙ ФУТЕР -->
    <footer class="sr-only">
      <!-- Скрытый футер для соблюдения семантики HTML5 -->
    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, type ComponentPublicInstance, watch } from 'vue'
import gsap from 'gsap'
import { useNuxtApp } from '#imports'
import { useEventBus } from '~/composables/useEventBus'
import { useOrganicCore } from '~/composables/useOrganicCore'
import { useDeviceSwitch } from '~/composables/useDeviceSwitch'
import DeviceSwitch from '~/components/DeviceSwitch.vue'
import DesktopLayoutHeader from '~/components/desktop/LayoutHeader.vue'
import MobileLayoutHeader from '~/components/mobile/LayoutHeader.vue'
import DesktopPhysicsMenu from '~/components/desktop/PhysicsMenu.vue'
import MobileMenu from '~/components/mobile/MobileMenu.vue'
import UiCursor from '~/components/UiCursor.vue'

const { $lenis } = useNuxtApp()
const { isPreloading } = useOrganicCore()
const { needsCursor } = useDeviceSwitch()

const layoutRef = ref<HTMLElement | null>(null)
const mainRef = ref<HTMLElement | null>(null)
const globalCoreRef = ref<ComponentPublicInstance & { expandForMenu: () => void, collapseFromMenu: () => void } | null>(null)
const isMenuOpen = ref(false)
const isMenuAnimating = ref(false)
const currentMenuLabel = ref('[ СТУДИЯ ]')
const isContactTyping = ref(false)
const isTechStackOpen = ref(false)

let menuTimer: ReturnType<typeof setTimeout> | null = null

const { emit, on } = useEventBus()

// Следим за состоянием меню, чтобы инвертировать курсор
watch(isMenuOpen, (newVal) => {
  if (typeof document !== 'undefined') {
    if (newVal) {
      document.body.classList.add('menu-is-open')
    } else {
      document.body.classList.remove('menu-is-open')
    }
  }
})

// Блокируем скролл во время загрузки (прелоадер) или открытия TechStack
watch([isPreloading, isTechStackOpen], ([preloading, techStackOpen]) => {
  if (typeof document !== 'undefined') {
    const lenis = useNuxtApp().$lenis
    if (preloading || techStackOpen) {
      if (lenis) lenis.stop()
      document.body.style.overflow = 'hidden'
    } else {
      if (lenis) lenis.start()
      document.body.style.overflow = ''
    }
  }
}, { immediate: true })

const menuItems = [
  { label: 'О нас', href: '#about' },
  { label: 'Процесс', href: '#approach' },
  { label: 'Проекты', href: '#portfolio' },
  { label: 'Прайс', href: '#price' },
  { label: 'Контакты', href: '#contact' }
]

const openMenu = () => {
  if (!globalCoreRef.value || isMenuAnimating.value) return
  isMenuAnimating.value = true
  isMenuOpen.value = true
  
  // Уведомляем компоненты об открытии меню, чтобы они могли плавно скрыть свой контент
  emit('menu-state', true)
  
  // 1. Сфера взрывается (Organic Core)
  if (globalCoreRef.value) {
    globalCoreRef.value.expandForMenu()
  }

  // Снимаем блокировку после завершения анимации
  if (menuTimer) clearTimeout(menuTimer)
  menuTimer = setTimeout(() => {
    isMenuAnimating.value = false
  }, 1200)
}

const closeMenu = () => {
  if (!globalCoreRef.value || isMenuAnimating.value) return
  isMenuAnimating.value = true
  
  isMenuOpen.value = false
  
  // Уведомляем компоненты о закрытии меню
  emit('menu-state', false)

  // Сфера схлопывается обратно
  if (globalCoreRef.value) {
    globalCoreRef.value.collapseFromMenu()
  }

  if (menuTimer) clearTimeout(menuTimer)
  menuTimer = setTimeout(() => {
    isMenuAnimating.value = false
  }, 1200)
}

const handleMenuClick = (href: string) => {
  if (isMenuAnimating.value) return
  closeMenu()
  setTimeout(() => {
    emit('nav-goto', href)
  }, 1250) // Ждем завершения схлопывания сферы и запуска lenis
}

const handleLogoClick = () => {
  if (isMenuAnimating.value) return
  if (isMenuOpen.value) {
    handleMenuClick('#hero')
  } else {
    emit('nav-goto', '#hero')
  }
}

onMounted(() => {
  // Слушаем смену секций для обновления кнопки
  on('section-change', (label: string) => {
    currentMenuLabel.value = label
  })

  // Отслеживаем активный ввод в анкете контактов для скрытия шапки
  on('contact-state', (state: { active: boolean, step: number, typing: boolean }) => {
    isContactTyping.value = state.typing
  })

  // Отслеживаем состояние окна технологий
  on('techstack-state', (state: { active: boolean, hoveredIndex?: number }) => {
    isTechStackOpen.value = state.active
  })
})

onBeforeUnmount(() => {
  if (menuTimer) clearTimeout(menuTimer)
})
</script>

<style scoped>
/* text-shadow удален для меню "Абсолютный Аккордеон" (чистый mix-blend-difference) */
</style>
