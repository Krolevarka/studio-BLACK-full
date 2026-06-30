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
    <div class="satellite-content text-white text-center flex flex-col items-center justify-center w-[6rem] h-[6rem] md:w-[10rem] md:h-[10rem] transition-opacity duration-300">
      <div class="text-xs md:text-[clamp(13px,0.73vw,15px)] font-bold uppercase tracking-tight leading-tight px-2">{{ option.name }}</div>
      <div class="text-[10px] md:text-[clamp(12px,0.65vw,13px)] mt-1 font-secondary tracking-widest tabular-nums">от {{ formatPrice(displayPrice) }} ₽</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import type { PriceOption } from '~/types/organic'
import { formatPrice } from '~/utils/format'

const props = defineProps<{
  option: PriceOption
  isActive: boolean
}>()

defineEmits(['startDrag', 'select', 'hover'])

const displayPrice = ref(props.option.price)

const stopWatch = watch(() => props.option.price, (newVal) => {
  gsap.to(displayPrice, {
    value: newVal,
    duration: 1.2,
    ease: 'power3.out',
    snap: { value: 1 }
  })
}, { immediate: true })

onBeforeUnmount(() => {
  stopWatch()
  gsap.killTweensOf(displayPrice)
})
</script>
