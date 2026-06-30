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
      :isPriceModalOpen="isPriceModalOpen"
      @logo-click="handleLogoClick"
      @toggle-menu="isMenuOpen ? closeMenu() : openMenu()"
    />

    <!-- ГЛОБАЛЬНАЯ СФЕРА (Organic Core) -->
    <!-- Десктоп: Canvas 2D (OrganicCore, НЕ трогаем). Мобайл: отдельный WebGL-движок. -->
    <div
      class="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none mix-blend-difference z-[40]"
    >
      <OrganicCore v-if="isDesktopDevice" ref="globalCoreRef" />
      <OrganicCoreMobile v-else ref="globalCoreRef" />
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

    <!-- ОВЕРЛЕЙ «ПОВЕРНИТЕ УСТРОЙСТВО» (только телефоны в landscape, чисто CSS) -->
    <MobileRotateNotice />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, type ComponentPublicInstance, watch, computed } from 'vue'
import gsap from 'gsap'
import { useNuxtApp, useHead } from '#imports'
import { useEventBus } from '~/composables/useEventBus'
import { ANIMATION_TIMINGS } from '~/utils/animation.config'
import { useOrganicCore } from '~/composables/useOrganicCore'
import { triggeriOSGyroPermission } from '~/composables/useMobileGyroMenu'
import { useDeviceSwitch } from '~/composables/useDeviceSwitch'
import DeviceSwitch from '~/components/DeviceSwitch.vue'
import DesktopLayoutHeader from '~/components/desktop/LayoutHeader.vue'
import MobileLayoutHeader from '~/components/mobile/LayoutHeader.vue'
import DesktopPhysicsMenu from '~/components/desktop/PhysicsMenu.vue'
import MobileMenu from '~/components/mobile/MobileMenu.vue'
import UiCursor from '~/components/UiCursor.vue'
import MobileRotateNotice from '~/components/MobileRotateNotice.vue'

const { $lenis } = useNuxtApp()
const { isPreloading } = useOrganicCore()
const { needsCursor, isDesktopDevice } = useDeviceSwitch()

const layoutRef = ref<HTMLElement | null>(null)
const mainRef = ref<HTMLElement | null>(null)
const globalCoreRef = ref<ComponentPublicInstance & { expandForMenu: () => void, collapseFromMenu: () => void } | null>(null)
const isMenuOpen = ref(false)
const isMenuAnimating = ref(false)
const currentMenuLabel = ref('[ СТУДИЯ ]')
const isContactTyping = ref(false)
const isTechStackOpen = ref(false)
const isPriceModalOpen = ref(false)

let menuTimer: ReturnType<typeof setTimeout> | null = null

const { emit, on } = useEventBus()

useHead({
  bodyAttrs: {
    class: computed(() => isMenuOpen.value ? 'menu-is-open' : ''),
    style: computed(() => (isPreloading.value || isTechStackOpen.value || isPriceModalOpen.value) ? 'overflow: hidden;' : '')
  }
})

// Блокируем скролл во время загрузки (прелоадер), открытия TechStack или модалки Прайса
watch([isPreloading, isTechStackOpen, isPriceModalOpen], ([preloading, techStackOpen, priceModalOpen]) => {
  if (import.meta.client) {
    if (preloading || techStackOpen || priceModalOpen) {
      if ($lenis) $lenis.stop()
    } else {
      if ($lenis) $lenis.start()
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
  triggeriOSGyroPermission()
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
  }, ANIMATION_TIMINGS.ui.menuTransition)
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
  }, ANIMATION_TIMINGS.ui.menuTransition)
}

const handleMenuClick = (href: string) => {
  if (isMenuAnimating.value) return
  closeMenu()
  setTimeout(() => {
    emit('nav-goto', href)
  }, ANIMATION_TIMINGS.ui.navGotoDelay) // Ждем завершения схлопывания сферы и запуска lenis
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

  // Отслеживаем состояние модалки сравнения подходов (Прайс)
  on('price-modal-state', (state: { active: boolean }) => {
    isPriceModalOpen.value = state.active
  })
})

onBeforeUnmount(() => {
  if (menuTimer) clearTimeout(menuTimer)
})
</script>

<style scoped>
/* Пустой блок стилей для корректной работы генератора @tailwindcss/vite в Nuxt */
</style>

