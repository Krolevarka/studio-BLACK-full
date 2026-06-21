<template>
  <div class="w-full">
    <input 
      v-if="!isTextarea"
      type="text" 
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @keydown.enter="$emit('enter')"
      class="w-full bg-transparent border-b border-white/30 text-xl md:text-2xl font-secondary text-left text-white focus:outline-none focus:border-white transition-colors pb-4 placeholder-white/20"
      :placeholder="placeholder"
    >
    <textarea 
      v-else
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @keydown.enter.prevent="$emit('enter')"
      rows="2"
      class="w-full bg-transparent border-b border-white/30 text-lg md:text-xl font-secondary text-left text-white focus:outline-none focus:border-white transition-colors pb-4 placeholder-white/20 resize-none overflow-hidden"
      :placeholder="placeholder"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string | string[]
  placeholder?: string
  isTextarea?: boolean
}>()

defineEmits(['update:modelValue', 'focus', 'blur', 'enter'])
</script>
