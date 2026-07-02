<template>
  <header 
    class="fixed top-0 left-0 w-full p-6 md:p-10 z-[60] flex justify-between items-center pointer-events-none mix-blend-difference transform-gpu text-white transition-opacity duration-1000"
    style="will-change: transform;"
    :class="isPreloading ? 'opacity-0' : 'opacity-100'"
  >
    <a
href="#hero" class="w-24 md:w-32 xl:w-40 flex items-center transition-opacity duration-500 price-collision-obstacle" 
       :class="isPriceModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto hover:opacity-70 cursor-pointer'"
       @click.prevent="$emit('logo-click')">
      <LogoText class="w-full h-auto fill-current" />
    </a>
    <!-- Правая часть: текст секции и бургер -->
    <!-- Правая часть: текст секции и бургер -->
    <div class="flex items-center gap-3 md:gap-6 transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] opacity-100 pointer-events-auto group/nav">
      <!-- Индикатор текущей секции -->
      <div 
        class="relative h-6 flex items-center pointer-events-none min-w-[6rem] md:min-w-[9rem] justify-end transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] price-collision-obstacle"
        :class="[
          !isBackMode ? (isMenuOpen ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0') : '',
          isBackMode ? 'opacity-0 translate-x-4 group-hover/nav:opacity-100 group-hover/nav:translate-x-0' : ''
        ]"
      >
        <Transition name="revolver">
          <span :key="displayLabel" class="absolute font-secondary uppercase text-[10px] md:text-[clamp(13px,0.73vw,15px)] tracking-[0.3em] whitespace-nowrap right-0 text-white/80">
            {{ displayLabel }}
          </span>
        </Transition>
      </div>

      <!-- Единая кнопка (Бургер / Крестик / Назад) -->
      <button 
        aria-label="Навигация"
        :aria-expanded="isMenuOpen"
        class="magnetic-btn relative w-12 h-12 flex items-center justify-center group price-collision-obstacle rounded-full pointer-events-auto cursor-pointer"
        @click="handleButtonClick"
      >
        <!-- Тонкое мягкое кольцо вокруг кнопки в режиме Назад -->
        <span
class="absolute inset-0 rounded-full border border-white/20 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
              :class="isBackMode ? 'opacity-100 scale-100 group-hover:border-white/45 group-hover:scale-[1.04]' : 'opacity-0 scale-75'"/>

        <!-- Контейнер для линий, который вращается на hover в режиме меню или сдвигается в режиме назад -->
        <div
class="relative w-6 h-6 flex items-center justify-center transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
             :class="[
               (isMenuOpen && !isBackMode) ? 'group-hover:rotate-90' : '',
               isBackMode ? 'group-hover:-translate-x-1 will-change-transform' : ''
             ]">
          
          <!-- Средняя линия (Ось стрелки ← в режиме BackMode) -->
          <span
class="absolute w-6 h-[1.5px] rounded-full bg-white transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center"
                :class="[
                  !isBackMode ? 'transform-gpu' : '',
                  isBackMode ? 'opacity-100' : 'opacity-0 scale-x-0'
                ]"
                :style="isBackMode ? { transform: 'scaleX(0.75)' } : {}"/>

          <!-- Верхняя линия -->
          <span
class="absolute w-6 h-[1.5px] rounded-full bg-white transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center"
                :class="[
                  !isBackMode ? 'transform-gpu group-hover:will-change-transform' : '',
                  (isMenuOpen || isMenuAnimating) && !isBackMode ? 'will-change-transform' : '',
                  !isBackMode ? (isMenuOpen ? 'rotate-45 translate-y-0 scale-x-100' : '-translate-y-[4px] scale-x-100 group-hover:scale-x-[0.66] group-hover:-translate-x-[4px]') : ''
                ]"
                :style="isBackMode ? { transform: 'translate3d(-0.33rem, -0.20rem, 0) rotate(-45deg) scaleX(0.38)' } : {}"/>

          <!-- Нижняя линия -->
          <span
class="absolute w-6 h-[1.5px] rounded-full bg-white transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center"
                :class="[
                  !isBackMode ? 'transform-gpu group-hover:will-change-transform' : '',
                  (isMenuOpen || isMenuAnimating) && !isBackMode ? 'will-change-transform' : '',
                  !isBackMode ? (isMenuOpen ? '-rotate-45 translate-y-0 translate-x-0 scale-x-100' : 'translate-y-[4px] translate-x-[4px] scale-x-[0.66] group-hover:scale-x-100 group-hover:translate-x-0') : ''
                ]"
                :style="isBackMode ? { transform: 'translate3d(-0.33rem, 0.20rem, 0) rotate(45deg) scaleX(0.38)' } : {}"/>
        </div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEventBus } from '~/composables/useEventBus'

const props = defineProps<{
  isPreloading: boolean
  isMenuOpen: boolean
  isMenuAnimating: boolean
  currentMenuLabel: string
  isTechStackOpen?: boolean
  isPriceModalOpen?: boolean
}>()

const emit = defineEmits<{
  'logo-click': []
  'toggle-menu': []
}>()

const { emit: emitBus } = useEventBus()

const isBackMode = computed(() => Boolean(props.isTechStackOpen || props.isPriceModalOpen))

const displayLabel = computed(() => {
  if (isBackMode.value) return 'НАЗАД'
  return props.currentMenuLabel
})

const handleButtonClick = () => {
  if (props.isTechStackOpen) {
    emitBus('techstack-close')
    return
  }
  if (props.isPriceModalOpen) {
    emitBus('price-modal-close')
    return
  }
  emit('toggle-menu')
}
</script>

<style scoped>
/* Анимация револьвера для текста секции */
.revolver-enter-active,
.revolver-leave-active {
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s ease;
}
.revolver-enter-from {
  transform: translateY(calc(-50% + 24px));
  filter: blur(8px);
  opacity: 0;
}
.revolver-leave-to {
  transform: translateY(calc(-50% - 24px));
  filter: blur(8px);
  opacity: 0;
}
</style>
