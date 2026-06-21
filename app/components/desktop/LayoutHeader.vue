<template>
  <header 
    class="fixed top-0 left-0 w-full p-6 md:p-10 z-[60] flex justify-between items-center pointer-events-none mix-blend-difference text-white transition-opacity duration-1000 transform-gpu"
    style="will-change: transform;"
    :class="isPreloading ? 'opacity-0' : 'opacity-100'"
  >
    <a href="#hero" @click.prevent="$emit('logo-click')" class="w-24 md:w-32 xl:w-40 flex items-center pointer-events-auto hover:opacity-70 transition-opacity price-collision-obstacle cursor-pointer">
      <LogoText class="w-full h-auto fill-current" />
    </a>
    <!-- Правая часть: текст секции и бургер -->
    <div class="flex items-center gap-3 md:gap-6 transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
         :class="isTechStackOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'">
      <!-- Индикатор текущей секции -->
      <div 
        class="relative h-6 flex items-center pointer-events-none min-w-[100px] md:min-w-[140px] justify-end transition-all duration-[600ms] ease-[cubic-bezier(0.25,1,0.5,1)] price-collision-obstacle"
        :class="isMenuOpen ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'"
      >
        <Transition name="revolver">
          <span :key="currentMenuLabel" class="absolute font-secondary uppercase text-[10px] md:text-sm tracking-[0.3em] whitespace-nowrap right-0 text-white/80">
            {{ currentMenuLabel }}
          </span>
        </Transition>
      </div>

      <!-- Единая кнопка (Бургер / Крестик) -->
      <button 
        @click="$emit('toggle-menu')"
        aria-label="Переключить меню навигации"
        :aria-expanded="isMenuOpen"
        class="magnetic-btn relative w-12 h-12 flex items-center justify-center group price-collision-obstacle rounded-full"
        :class="isTechStackOpen ? 'pointer-events-none' : 'pointer-events-auto'"
      >
        <!-- Контейнер для линий, который вращается на hover, если меню открыто -->
        <div class="relative w-6 h-6 flex items-center justify-center transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
             :class="isMenuOpen ? 'group-hover:rotate-90' : ''">
          
          <!-- Верхняя линия -->
          <span class="absolute w-6 h-[1.5px] bg-white transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center group-hover:will-change-transform"
                :class="[
                  isMenuOpen || isMenuAnimating ? 'will-change-transform' : '',
                  isMenuOpen ? 'rotate-45 translate-y-0 scale-x-100' : '-translate-y-[4px] scale-x-100 group-hover:scale-x-[0.66] group-hover:-translate-x-[4px]'
                ]">
          </span>

          <!-- Нижняя линия -->
          <span class="absolute w-6 h-[1.5px] bg-white transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center group-hover:will-change-transform"
                :class="[
                  isMenuOpen || isMenuAnimating ? 'will-change-transform' : '',
                  isMenuOpen ? '-rotate-45 translate-y-0 translate-x-0 scale-x-100' : 'translate-y-[4px] translate-x-[4px] scale-x-[0.66] group-hover:scale-x-100 group-hover:translate-x-0'
                ]">
          </span>
        </div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  isPreloading: boolean
  isMenuOpen: boolean
  isMenuAnimating: boolean
  currentMenuLabel: string
  isTechStackOpen?: boolean
}>()

defineEmits<{
  (e: 'logo-click'): void
  (e: 'toggle-menu'): void
}>()
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
