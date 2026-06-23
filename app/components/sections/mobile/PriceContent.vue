<template>
  <section ref="priceRef" v-bind="$attrs" class="relative h-svh w-full flex flex-col items-center justify-center bg-transparent z-10 touch-none overflow-hidden">
    
    <div class="w-full max-w-sm mx-auto flex flex-col h-full justify-between pointer-events-none transition-[opacity,transform] duration-1000 ease-out pt-20 pb-16 px-6"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      
      <!-- Навигация: Чипы -->
      <div class="w-full flex flex-wrap gap-2 justify-center pointer-events-auto transition-all duration-700 delay-100 ease-out"
           :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'">
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

      <!-- Центральный Контент -->
      <div class="flex-1 flex flex-col justify-center items-center w-full relative pointer-events-none my-6">
        <transition name="fade" mode="out-in">
          <div :key="activeOption.id" class="flex flex-col items-center text-center w-full">
            <h3 class="font-primary text-[1.75rem] leading-tight font-bold uppercase tracking-tight text-white mb-2 transition-all duration-700 delay-200 ease-out"
                :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'">
              {{ activeOption.name }}
            </h3>
            
            <div class="font-secondary text-lg font-medium text-white mb-4 transition-all duration-700 delay-300 ease-out"
                 :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'">
              {{ activeOption.price.toLocaleString('ru-RU') }} ₽
            </div>
            
            <p class="font-secondary text-sm text-white/50 leading-relaxed max-w-[17.5rem] mb-8 transition-all duration-700 delay-400 ease-out"
               :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'">
              {{ activeOption.description }}
            </p>
            
            <div class="transition-all duration-700 delay-500 ease-out pointer-events-auto"
                 :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'">
              <button 
                @click="toggleOption(activeOption.id)"
                class="px-8 py-3 rounded-full font-secondary text-xs uppercase tracking-widest font-bold transition-all duration-300 border active:scale-[0.97] min-h-[2.75rem] min-w-[2.75rem]"
                :class="activeOption.selected 
                  ? 'bg-transparent border-white/20 text-white/50 hover:border-white/40 hover:text-white' 
                  : 'bg-transparent border-white/80 text-white hover:bg-white hover:text-black'"
              >
                {{ activeOption.selected ? 'Убрать из чека' : 'Добавить в чек' }}
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- Итог -->
      <div class="w-full pointer-events-auto transition-all duration-700 delay-500 ease-out"
           :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
        <div class="border-t border-white/10 pt-6">
          <div class="flex justify-between items-end mb-6">
            <div class="font-secondary text-xs uppercase tracking-widest text-white/50 mb-1">Итого:</div>
            <div class="font-primary text-4xl font-black text-white leading-none tracking-tight">
              {{ Math.round(displayPrice).toLocaleString('ru-RU') }} <span class="text-2xl">₽</span>
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
import type { PriceOption } from '~/types/organic'

defineOptions({ inheritAttrs: false })

const priceRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const { emit, on } = useEventBus()
const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()

const options = ref<PriceOption[]>([
  { id: 'opt1', name: 'Брендинг', price: 150000, selected: false, angle: 0, radiusOffset: 0, description: 'Разработка логотипа, фирменного стиля, гайдлайнов и коммуникационной стратегии.' },
  { id: 'opt2', name: 'Веб-разработка', price: 300000, selected: false, angle: 0, radiusOffset: 0, description: 'Создание премиальных сайтов и интерфейсов с использованием Canvas, WebGL и плавных анимаций.' },
  { id: 'opt3', name: '3D & Motion', price: 200000, selected: false, angle: 0, radiusOffset: 0, description: 'Интеграция интерактивных 3D-сцен, метаболов, симуляций жидкостей и захватывающих видео-роликов.' },
  { id: 'opt4', name: 'Копирайтинг', price: 80000, selected: false, angle: 0, radiusOffset: 0, description: 'Написание цепляющих текстов, SEO-оптимизированных статей и UX-райтинг интерфейса.' },
  { id: 'opt5', name: 'SEO & Аналитика', price: 120000, selected: false, angle: 0, radiusOffset: 0, description: 'Оптимизация сайта под поисковые системы, настройка счетчиков и глубокая аналитика конверсий.' }
])

const activeTabId = ref(options.value[0]!.id)

const activeOption = computed(() => {
  return options.value.find(o => o.id === activeTabId.value) || options.value[0]!
})

const basePrice = 0
const displayPrice = ref(0)

const totalPrice = computed(() => {
  return options.value.reduce((acc, opt) => opt.selected ? acc + opt.price : acc, basePrice)
})

const toggleOption = (id: string) => {
  const opt = options.value.find(o => o.id === id)
  if (opt) {
    opt.selected = !opt.selected
    emit('price-update', { 
      active: true, 
      options: options.value.map(o => ({ ...o })), 
      totalPrice: totalPrice.value 
    })
  }
}

const stopWatch = watch(totalPrice, (newVal) => {
  gsap.to(displayPrice, {
    value: newVal,
    duration: 1,
    ease: 'power3.out'
  })
})

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible.value = true
        observer?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.2 })

  if (priceRef.value) {
    observer.observe(priceRef.value)
  }

  on('section-change', (label: string) => {
    if (label === '[ Прайс ]') {
      emit('price-state', true)
      emit('price-update', { 
        active: true, 
        options: options.value.map(o => ({ ...o })), 
        totalPrice: totalPrice.value 
      })
    } else {
      emit('price-state', false)
    }
  })
})

onBeforeUnmount(() => {
  stopWatch()
  if (observer) {
    observer.disconnect()
    observer = null
  }
  gsap.killTweensOf(displayPrice)
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
