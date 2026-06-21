<template>
  <div class="w-full relative group">
    <input 
      v-if="!isTextarea"
      type="text" 
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter="$emit('enter')"
      class="w-full bg-transparent border-b-2 border-white/20 text-[1.25rem] font-secondary text-left text-white focus:outline-none focus:border-white transition-colors duration-500 pb-3 placeholder-white/30"
      :placeholder="placeholder"
    >
    <textarea 
      v-else
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.enter.prevent="$emit('enter')"
      rows="2"
      class="w-full bg-transparent border-b-2 border-white/20 text-[1.25rem] font-secondary text-left text-white focus:outline-none focus:border-white transition-colors duration-500 pb-3 placeholder-white/30 resize-none overflow-hidden"
      :placeholder="placeholder"
    ></textarea>
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
