<template>
  <nav aria-label="Основное меню" class="fixed inset-0 w-full h-full z-50 pointer-events-none mix-blend-difference transform-gpu">
    <div class="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-1 md:gap-4 overflow-hidden">
      <!-- Container for physics items -->
      <nuxt-link
        v-for="(item, index) in items" 
        :key="index"
        :href="item.href"
        @click.prevent="$emit('navigate', item.href)"
        @mouseenter="onMouseEnter(index)"
        @mouseleave="onMouseLeave(index)"
        class="physics-item relative flex items-center justify-center cursor-pointer select-none py-1 md:py-2"
        :class="isOpen ? 'pointer-events-auto' : 'pointer-events-none'"
        :aria-label="item.label"
      >
        <!-- Текст меню -->
        <span 
          class="item-text relative z-10 text-white font-primary font-black uppercase tracking-tighter leading-none whitespace-nowrap text-5xl md:text-7xl lg:text-[7rem] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" 
          :class="isOpen ? 'opacity-100 blur-none translate-y-0' : 'opacity-0 blur-md translate-y-12'"
          :style="{ transitionDelay: isOpen ? `${0.3 + index * 0.08}s` : '0s', willChange: isOpen ? 'transform' : 'auto' }"
        >
          {{ item.label }}
        </span>
        <!-- Индекс -->
        <span 
          class="item-index absolute top-0 -left-12 text-white text-sm md:text-xl font-secondary tracking-widest hidden md:block transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" 
          :class="isOpen ? 'opacity-50 blur-none translate-y-0' : 'opacity-0 blur-md translate-y-12'"
          :style="{ transitionDelay: isOpen ? `${0.3 + index * 0.08}s` : '0s', willChange: isOpen ? 'transform' : 'auto' }"
        >
          [ 0{{ index + 1 }} ]
        </span>
      </nuxt-link>
    </div>

  </nav>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { usePhysicsMenu } from '~/composables/usePhysicsMenu'

const props = defineProps<{
  isOpen: boolean
  items: Array<{ label: string, href: string }>
}>()

const { onMouseEnter, onMouseLeave } = usePhysicsMenu(toRef(props, 'isOpen'))

</script>

<style scoped>
.physics-item {
  transform-origin: center center;
}
</style>
