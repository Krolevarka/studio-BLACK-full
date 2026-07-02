<template>
  <div class="w-full relative group">
    <input 
      v-if="!isTextarea"
      type="text" 
      :value="modelValue"
      class="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 text-[1.25rem] font-secondary text-left text-white outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:border-t-0 focus:border-l-0 focus:border-r-0 focus:border-b-2 focus:border-white shadow-none focus:shadow-none transition-colors duration-500 pb-3 placeholder-white/30"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="$emit('enter')"
    >
    <textarea 
      v-else
      :value="modelValue"
      rows="2"
      class="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 border-white/20 text-[1.25rem] font-secondary text-left text-white outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:border-t-0 focus:border-l-0 focus:border-r-0 focus:border-b-2 focus:border-white shadow-none focus:shadow-none transition-colors duration-500 pb-3 placeholder-white/30 resize-none overflow-hidden"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter.prevent="$emit('enter')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: string | string[]
  placeholder?: string
  isTextarea?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'focus', 'blur', 'enter'])

const isFocused = ref(false)

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}
</script>

<style scoped>
input, textarea {
  outline: none !important;
  box-shadow: none !important;
}
input:focus, input:focus-visible, textarea:focus, textarea:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
</style>
