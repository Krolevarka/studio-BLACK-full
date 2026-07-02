<template>
  <div class="flex items-start gap-3 select-none">
    <!-- Кастомный чекбокс (не предустановлен): активное действие пользователя -->
    <div
      role="checkbox"
      :aria-checked="modelValue"
      :aria-label="'Согласие на обработку персональных данных'"
      tabindex="0"
      class="shrink-0 mt-0.5 w-5 h-5 rounded-[6px] border flex items-center justify-center cursor-pointer transition-all duration-300 min-w-[20px]"
      :class="[
        modelValue ? 'bg-white border-white' : 'bg-transparent border-white/30 hover:border-white/60',
        highlight && !modelValue ? 'border-red-400/70 shake' : ''
      ]"
      @click="toggle"
      @keydown.enter.prevent="toggle"
      @keydown.space.prevent="toggle"
    >
      <svg
        v-show="modelValue"
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </div>

    <p class="font-secondary text-[11px] md:text-[12px] leading-relaxed text-white/50">
      Я даю согласие на обработку персональных данных и принимаю условия
      <button
        type="button"
        class="text-white/80 underline underline-offset-2 decoration-white/30 hover:decoration-white hover:text-white transition-colors"
        @click="openPrivacy"
      >
        Политики конфиденциальности</button>.
    </p>
  </div>
</template>

<script setup lang="ts">
import { useLegalModal } from '~/composables/useLegalModal'

const props = defineProps<{
  modelValue: boolean
  /** Подсветить как ошибку, если попытались отправить без согласия */
  highlight?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { open } = useLegalModal()

const toggle = () => emit('update:modelValue', !props.modelValue)
const openPrivacy = () => open('privacy')
</script>

<style scoped>
@keyframes legal-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}
.shake {
  animation: legal-shake 0.32s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}
</style>
