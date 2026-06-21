<template>
  <div class="w-full grid grid-cols-1 gap-2">
    <button 
      v-for="opt in options" 
      :key="opt"
      @click="$emit('toggle', opt)"
      class="w-full min-h-[3rem] px-4 py-3 rounded-[1rem] border transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] font-secondary text-[0.875rem] text-left touch-manipulation active:scale-[0.98]"
      :class="isSelected(opt) ? 'bg-white text-black border-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)] font-bold' : 'bg-white/5 text-white border-white/10 hover:bg-white/10 active:bg-white/20'"
    >
      <div class="flex items-center justify-between gap-3">
        <span class="leading-snug">{{ opt }}</span>
        <div class="w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0"
             :class="isSelected(opt) ? 'border-black bg-black' : 'border-white/30'">
          <div class="w-2 h-2 rounded-full bg-white transition-transform duration-300"
               :class="isSelected(opt) ? 'scale-100' : 'scale-0'"></div>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  options: string[]
  selectedOptions: string | string[]
}>()

defineEmits(['toggle'])

const isSelected = (opt: string) => {
  if (Array.isArray(props.selectedOptions)) {
    return props.selectedOptions.includes(opt)
  }
  return props.selectedOptions === opt
}
</script>
