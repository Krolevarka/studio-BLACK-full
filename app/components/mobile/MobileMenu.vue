<template>
  <nav aria-label="Мобильное меню" class="fixed inset-0 w-full h-full z-50 pointer-events-none mix-blend-difference transform-gpu">
    <div
class="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-6 sm:gap-8 overflow-hidden transition-opacity duration-500"
         :class="isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'">
      <nuxt-link
        v-for="(item, index) in items" 
        :key="index"
        :href="item.href"
        class="mobile-physics-item relative flex items-center justify-center cursor-pointer select-none py-3 px-8 min-h-[2.75rem] min-w-[2.75rem]"
        :aria-label="item.label"
        style="touch-action: none;"
        @click.prevent="$emit('navigate', item.href)"
      >
        <span 
          class="relative z-10 text-white font-primary font-black uppercase tracking-tighter leading-none whitespace-nowrap text-4xl sm:text-5xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" 
          :class="isOpen ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-8 blur-sm'"
          :style="{ transitionDelay: isOpen ? `${0.2 + index * 0.05}s` : '0s', willChange: isOpen ? 'transform, opacity' : 'auto' }"
        >
          {{ item.label }}
        </span>
      </nuxt-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useMobileGyroMenu } from '~/composables/useMobileGyroMenu'

const props = defineProps<{
  isOpen: boolean
  items: Array<{ label: string, href: string }>
}>()

defineEmits<{
  (e: 'navigate', href: string): void
}>()

useMobileGyroMenu(toRef(props, 'isOpen'))
</script>
