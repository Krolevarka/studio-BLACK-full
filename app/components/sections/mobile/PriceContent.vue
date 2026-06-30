<template>
  <section ref="priceRef" v-bind="$attrs" class="reveal-scope-mobile relative h-svh w-full flex flex-col items-center justify-center bg-transparent z-10 touch-none overflow-hidden">
    <PriceDevModeModal :is-open="showDevModeModal" @close="showDevModeModal = false" />

    <div class="w-full max-w-sm mx-auto flex flex-col h-full justify-between pointer-events-none transition-[opacity,transform] duration-1000 ease-out pt-20 pb-16 px-6"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      
      <!-- Навигация: Чипы -->
      <div class="reveal-item w-full flex flex-wrap gap-2 justify-center pointer-events-auto"
           :class="{ 'is-revealed': revealed }">
        <button 
          v-for="opt in options" :key="opt.id"
          @click="activeTabId = opt.id"
          class="px-4 py-2 rounded-full border text-[0.6875rem] font-secondary uppercase tracking-widest transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex items-center justify-center min-h-[2.75rem] min-w-[2.75rem]"
          :class="opt.id === activeTabId ? 'bg-white/10 border-white/40 text-white' : 'bg-transparent border-white/15 text-white/60 hover:text-white hover:border-white/30'"
        >
          <div 
            class="rounded-full bg-white transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0"
            :class="opt.selected ? 'w-1.5 h-1.5 opacity-100 mr-2' : 'w-0 h-1.5 opacity-0 mr-0'"
          ></div>
          <span class="whitespace-nowrap">{{ opt.name }}</span>
        </button>
      </div>

      <!-- Центральный Контент (reveal — на стабильной обёртке, внутри свой fade для смены вкладок) -->
      <div class="reveal-item flex-1 flex flex-col justify-center items-center w-full relative pointer-events-none my-6"
           :class="{ 'is-revealed': revealed }" style="--reveal-delay: 150ms">
        <transition name="fade" mode="out-in">
          <div :key="activeOption.id" class="flex flex-col items-center text-center w-full">
            <h3 class="font-primary text-[1.75rem] leading-tight font-bold uppercase tracking-tight text-white mb-2">
              {{ activeOption.name }}
            </h3>

            <div class="font-secondary text-lg font-medium text-white mb-4 tabular-nums">
              от {{ Math.round(activeOptionDisplayPrice).toLocaleString('ru-RU') }} ₽
            </div>

            <p class="font-secondary text-sm text-white/50 leading-relaxed max-w-[17.5rem] mb-8">
              {{ activeOption.description }}
            </p>

            <div class="pointer-events-auto">
              <button 
                @click="toggleOption(activeOption.id)"
                class="px-8 py-3 rounded-full font-secondary text-xs uppercase tracking-widest font-bold transition-all duration-300 border active:scale-[0.97] min-h-[2.75rem] min-w-[2.75rem]"
                :class="activeOption.selected 
                  ? 'bg-transparent border-white/20 text-white/50 hover:border-white/40 hover:text-white' 
                  : 'bg-transparent border-white/80 text-white hover:bg-white hover:text-black'"
              >
                {{ activeOption.selected ? 'Убрать из проекта' : 'Добавить в проект' }}
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Переключатель режимов -->
      <div class="reveal-item w-full pointer-events-auto my-3"
           :class="{ 'is-revealed': revealed }" style="--reveal-delay: 240ms">
        <PriceDevModeSwitch />
      </div>

      <!-- Итог -->
      <div class="reveal-item w-full pointer-events-auto"
           :class="{ 'is-revealed': revealed }" style="--reveal-delay: 320ms">
        <div class="border-t border-white/10 pt-6">

          <div class="flex justify-between items-end mb-6">
            <div class="font-secondary text-xs uppercase tracking-widest text-white/50 mb-1">Итого:</div>
            <div class="font-primary text-4xl font-black text-white leading-none tracking-tight tabular-nums">
              <span v-if="displayPrice > 0" class="text-2xl align-baseline mr-1">от</span>{{ Math.round(displayPrice).toLocaleString('ru-RU') }} <span class="text-2xl">₽</span>
            </div>
          </div>
          
          <UiButton 
            class="w-full font-secondary !bg-white !text-black !border-transparent hover:!bg-white/90 active:!bg-white/80 transition-colors duration-200 min-h-[3rem] flex items-center justify-center text-sm uppercase tracking-widest font-bold touch-manipulation"
            :class="totalPrice > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'"
            to="#contact"
          >
            Утвердить проект
          </UiButton>
        </div>
      </div>
      
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'
import { usePriceDevMode } from '~/composables/usePriceDevMode'
import type { PriceOption } from '~/types/organic'
import { createProductBuilderOptions } from '~/data/productBuilderOptions'
import PriceDevModeSwitch from '~/components/sections/price/PriceDevModeSwitch.vue'
import PriceDevModeModal from '~/components/sections/price/PriceDevModeModal.vue'

defineOptions({ inheritAttrs: false })

const priceRef = ref<HTMLElement | null>(null)

const { emit, on, off } = useEventBus()
const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { getEffectivePrice, priceDevMode } = usePriceDevMode()

const showDevModeModal = ref(false)

// Унифицированное появление/исчезновение контента секции.
// enterDelay: ждём, пока органическая сфера разложится в формы прайса (морф ~2.4s от старта скролла,
// прибытие ~2.0s) — элементы выходят уже после трансформации.
const { revealed } = useSectionReveal('[ Прайс ]')

const options = ref<PriceOption[]>(createProductBuilderOptions(true))

const activeTabId = ref(options.value[0]!.id)

const activeOption = computed(() => {
  return options.value.find(o => o.id === activeTabId.value) || options.value[0]!
})

const activeOptionDisplayPrice = ref(0)

const stopActiveOptionWatch = watch(() => activeOption.value.price, (newVal) => {
  gsap.to(activeOptionDisplayPrice, {
    value: newVal,
    duration: 1,
    ease: 'power3.out',
    snap: { value: 1 }
  })
}, { immediate: true })

const basePrice = 0
const displayPrice = ref(0)

const totalPrice = computed(() => {
  return options.value.reduce((acc, opt) => opt.selected ? acc + opt.price : acc, basePrice)
})

const isPriceActive = ref(false)

const stopDevModeWatch = watch(priceDevMode, () => {
  options.value.forEach(opt => {
    if (opt.basePrice === undefined) opt.basePrice = opt.price
    opt.price = getEffectivePrice(opt.basePrice)
  })
  if (isPriceActive.value) {
    emit('price-update', { 
      active: true, 
      options: options.value.map(o => ({ ...o })), 
      totalPrice: totalPrice.value 
    })
  }
}, { immediate: true })

const toggleOption = (id: string) => {
  const opt = options.value.find(o => o.id === id)
  if (opt) {
    opt.selected = !opt.selected
    if (isPriceActive.value) {
      emit('price-update', { 
        active: true, 
        options: options.value.map(o => ({ ...o })), 
        totalPrice: totalPrice.value 
      })
    }
  }
}

const stopWatch = watch(totalPrice, (newVal) => {
  gsap.to(displayPrice, {
    value: newVal,
    duration: 1,
    ease: 'power3.out',
    snap: { value: 1 }
  })
})

const handlePriceModalState = (state: { active: boolean }) => {
  showDevModeModal.value = state.active
}

const handleSectionChange = (label: string) => {
  if (label === '[ Прайс ]') {
    isPriceActive.value = true
    emit('price-state', true)
    emit('price-update', { 
      active: true, 
      options: options.value.map(o => ({ ...o })), 
      totalPrice: totalPrice.value 
    })
  } else {
    isPriceActive.value = false
    emit('price-state', false)
  }
}

watch(showDevModeModal, (val) => {
  const items = priceRef.value?.querySelectorAll('.reveal-item')
  if (items?.length) {
    gsap.killTweensOf(items)
    if (val) {
      gsap.to(items, { y: 20, opacity: 0, duration: 0.5, ease: 'power3.inOut' })
    } else {
      gsap.to(items, { y: 0, opacity: 1, duration: 0.6, ease: 'power4.out', delay: 0.15, clearProps: 'transform' })
    }
  }
})

onMounted(() => {
  on('price-modal-state', handlePriceModalState)
  on('section-change', handleSectionChange)
})

onBeforeUnmount(() => {
  stopWatch()
  stopDevModeWatch()
  stopActiveOptionWatch()
  gsap.killTweensOf(displayPrice)
  gsap.killTweensOf(activeOptionDisplayPrice)
  const items = priceRef.value?.querySelectorAll('.reveal-item')
  if (items?.length) gsap.killTweensOf(items)
  off('price-modal-state', handlePriceModalState)
  off('section-change', handleSectionChange)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  will-change: opacity, transform;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
