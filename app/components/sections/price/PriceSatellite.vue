<template>
  <div 
    class="no-swipe absolute cursor-grab active:cursor-grabbing transition-opacity duration-500 flex flex-col items-center justify-center group touch-none select-none"
    style="left: 50%; top: 50%;"
    :class="{ 
      'opacity-0 pointer-events-none': option.selected,
      'pointer-events-auto': isActive && !option.selected,
      'pointer-events-none': !isActive
    }"
    role="button"
    tabindex="0"
    :aria-label="option.name"
    @pointerdown="$emit('startDrag', option, $event)"
    @keydown.enter="$emit('select', option)"
    @pointerenter="$emit('hover', option.id)"
    @pointerleave="$emit('hover', null)"
    @wheel.prevent
    @touchmove.prevent
  >
    <div class="satellite-content text-white text-center flex flex-col items-center justify-center w-[100px] h-[100px] md:w-[160px] md:h-[160px] transition-opacity duration-300">
      <div class="text-xs md:text-sm font-bold uppercase tracking-tight leading-tight px-2">{{ option.name }}</div>
      <div class="text-[10px] md:text-xs mt-1 font-secondary tracking-widest">{{ formatPrice(option.price) }} ₽</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PriceOption } from '~/types/organic'

defineProps<{
  option: PriceOption
  isActive: boolean
}>()

defineEmits(['startDrag', 'select', 'hover'])

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}
</script>
