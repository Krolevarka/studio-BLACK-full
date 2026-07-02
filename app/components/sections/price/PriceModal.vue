<template>
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
    >
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black/60 backdrop-blur-md" 
        @click="$emit('close')" 
      />
      
      <!-- Panel -->
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        data-lenis-prevent
        class="relative w-full md:max-w-2xl bg-[#0a0a0a] border-t md:border border-white/10 md:rounded-3xl rounded-t-3xl p-6 md:p-10 shadow-2xl max-h-[80vh] overflow-y-auto"
      >
        <div class="flex justify-between items-center mb-8">
          <h3 id="modal-title" class="text-xl md:text-2xl font-bold uppercase tracking-widest text-white">Модули проекта</h3>
          <button aria-label="Закрыть модальное окно" class="text-white/50 hover:text-white text-3xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center" @click="$emit('close')">&times;</button>
        </div>
        
        <div class="flex flex-col gap-6">
          <div v-for="opt in options" :key="opt.id" class="border-b border-white/5 pb-6 last:border-0">
            <div class="flex justify-between items-end mb-2">
              <h4 class="text-base md:text-lg font-bold text-white uppercase">{{ opt.name }}</h4>
              <span class="text-sm font-secondary tracking-widest text-white/50">от {{ formatPrice(opt.price) }} ₽</span>
            </div>
            <p class="text-sm font-secondary text-white/70 leading-relaxed">{{ opt.description }}</p>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import type { PriceOption } from '~/types/organic'
import { formatPrice } from '~/utils/format'

defineProps<{
  isOpen: boolean
  options: PriceOption[]
}>()

defineEmits(['close'])
</script>
