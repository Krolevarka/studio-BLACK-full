<template>
  <div 
    class="cursor-pointer flex flex-col items-center justify-center rounded-full w-[250px] h-[250px] md:w-[350px] md:h-[350px]"
    :class="isActive ? 'pointer-events-auto' : 'pointer-events-none'"
    role="button"
    tabindex="0"
    aria-label="Убрать последнюю выбранную услугу"
    @click="$emit('unselectLast')"
    @keydown.enter="$emit('unselectLast')"
  >
    <div class="text-xs font-secondary uppercase tracking-[0.3em] mb-2 pointer-events-none">ЦЕННОСТЬ ПРОЕКТА</div>
    <div class="total-price text-5xl md:text-7xl lg:text-8xl font-black tabular-nums tracking-tighter pointer-events-none whitespace-nowrap">
      {{ formatPrice(displayPrice) }} ₽
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isActive: boolean
  displayPrice: number
}>()

defineEmits(['unselectLast'])

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}
</script>
