<template>
  <div 
    class="cursor-pointer flex flex-col items-center justify-center rounded-full w-[16rem] h-[16rem] md:w-[22rem] md:h-[22rem]"
    :class="isActive ? 'pointer-events-auto' : 'pointer-events-none'"
    role="button"
    tabindex="0"
    aria-label="Убрать последний выбранный модуль"
    @click="$emit('unselectLast')"
    @keydown.enter="$emit('unselectLast')"
  >
    <div class="text-[clamp(12px,0.65vw,13px)] font-secondary uppercase tracking-[0.3em] mb-2 pointer-events-none">СБОРКА ПРОЕКТА</div>
    <div class="total-price text-5xl md:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter pointer-events-none whitespace-nowrap">
      <span v-if="displayPrice > 0" class="text-2xl md:text-4xl lg:text-5xl align-baseline mr-2">от</span>{{ formatPrice(displayPrice) }} ₽
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatPrice } from '~/utils/format'

defineProps<{
  isActive: boolean
  displayPrice: number
}>()

defineEmits(['unselectLast'])

</script>
