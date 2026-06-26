<template>
  <div class="w-full flex flex-wrap gap-3">
    <button 
      v-for="opt in options" 
      :key="opt"
      @click="$emit('toggle', opt)"
      class="magnetic-btn px-5 py-3 rounded-full border transition-all duration-300 font-secondary text-xs md:text-[clamp(13px,0.73vw,15px)] uppercase tracking-widest"
      :class="isSelected(opt) ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/30 hover:border-transparent'"
    >
      {{ opt }}
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
