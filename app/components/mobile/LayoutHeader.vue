<template>
  <header 
    class="fixed top-0 left-0 w-full p-4 sm:p-6 z-[60] flex justify-between items-center pointer-events-none text-white transition-opacity duration-1000 mix-blend-difference transform-gpu"
    :class="isPreloading || isContactTyping ? 'opacity-0' : 'opacity-100'"
  >
    <a href="#hero" @click.prevent="$emit('logo-click')" class="w-20 sm:w-24 flex items-center pointer-events-auto cursor-pointer min-h-[2.75rem] min-w-[2.75rem]"
       style="touch-action: none;">
      <LogoText class="w-full h-auto fill-current" />
    </a>
    
    <button 
      @click="$emit('toggle-menu')"
      @keydown.enter="$emit('toggle-menu')"
      aria-label="Переключить меню навигации"
      :aria-expanded="isMenuOpen"
      role="button"
      tabindex="0"
      class="relative w-12 h-12 flex items-center justify-center rounded-full min-h-[2.75rem] min-w-[2.75rem] transition-opacity duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
      :class="isTechStackOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'"
      style="touch-action: none;"
    >
      <div class="relative w-6 h-6 flex items-center justify-center transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
        
        <span class="absolute w-6 h-[1.5px] bg-white transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center"
              :class="[
                isMenuOpen || isMenuAnimating ? 'will-change-transform' : '',
                isMenuOpen ? 'rotate-45 translate-y-0 scale-x-100' : '-translate-y-[4px] scale-x-100'
              ]">
        </span>

        <span class="absolute w-6 h-[1.5px] bg-white transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-center"
              :class="[
                isMenuOpen || isMenuAnimating ? 'will-change-transform' : '',
                isMenuOpen ? '-rotate-45 translate-y-0 scale-x-100' : 'translate-y-[4px] scale-x-100'
              ]">
        </span>
      </div>
    </button>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  isPreloading: boolean
  isMenuOpen: boolean
  isMenuAnimating: boolean
  isContactTyping?: boolean
  isTechStackOpen?: boolean
}>()

defineEmits<{
  (e: 'logo-click'): void
  (e: 'toggle-menu'): void
}>()
</script>
