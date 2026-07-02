<template>
  <div 
    v-show="isVisible"
    ref="containerRef"
    class="no-swipe fixed inset-0 w-full h-[100dvh] z-50 overflow-y-auto overflow-x-hidden flex flex-col bg-[#050505] text-white touch-manipulation select-none"
    data-lenis-prevent="true"
    :class="[isMenuTransitioning ? 'transition-opacity' : '', isMenuOpenLocal ? '!opacity-0 duration-[1000ms]' : '']"
  >
    <!-- Контентная область журнала: воздух и роскошные пропорции -->
    <div ref="contentRef" class="relative w-full min-h-full opacity-0 pointer-events-none overflow-x-hidden px-5 sm:px-6 pt-20 sm:pt-24 pb-8 flex flex-col justify-between gap-6">
      
      <!-- Редакционная Шапка (Без внутренних кнопок, во всю ширину) -->
      <div class="modal-header relative flex flex-col pb-4 border-b border-white/20 w-full shrink-0">
        <span class="w-fit text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.25em] mb-1">
          STUDIO-BLACK // ARCHITECTURAL AI
        </span>
        <h3 class="font-primary text-2xl sm:text-3xl font-black text-white uppercase leading-none tracking-tight">
          Эволюция разработки
        </h3>
      </div>

      <!-- Главная сцена (Hero Stage) с роскошным, свободным для чтения текстом -->
      <div class="hero-stage flex-1 flex flex-col justify-center my-auto w-full min-h-[260px]">
        <transition name="fade-stage" mode="out-in">
          <div :key="activeRow?.id || 'default'" class="flex flex-col w-full py-4">
            
            <!-- Верхний ряд сцены: Тег пункта со слэшами и Капсула статистики -->
            <div class="flex items-center justify-between gap-3 mb-3 sm:mb-4">
              <span class="text-xs font-mono font-bold text-white/50 tracking-[0.2em] uppercase">
                {{ activeRow?.editorial?.tag || `0${activeTabIndex + 1} // СТАНДАРТ` }}
              </span>
              <span v-if="activeRow?.editorial?.stat" class="px-3 py-1 rounded-full text-xs font-mono font-black bg-white text-black uppercase tracking-widest shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {{ activeRow?.editorial?.stat }}
              </span>
            </div>

            <!-- Крупный плакатный заголовок сцены -->
            <h4 class="font-primary font-black uppercase text-3xl sm:text-4xl text-white tracking-tight leading-none mb-3 sm:mb-4">
              {{ activeRow?.editorial?.headline || activeRow?.giantText }}
            </h4>

            <!-- Просторный, крупный и комфортный текст описания (Без сжатия!) -->
            <p v-if="activeRow?.editorial?.body" class="text-sm sm:text-base font-secondary text-white/85 leading-relaxed max-w-[340px] sm:max-w-[380px]">
              {{ activeRow?.editorial?.body }}
            </p>

          </div>
        </transition>
      </div>

      <!-- Бунтарский Оптический Видоискатель («Opium Core + Swiss Typography») -->
      <div class="viewfinder-section shrink-0 flex flex-col gap-2.5 w-full pt-4 border-t border-white/15 pointer-events-auto">
        <div class="relative w-full h-16 sm:h-18 bg-[#060606] border border-white/20 rounded-2xl overflow-hidden">
          
          <!-- Монолитная белая рамка инверсии (Opium Monolith Frame) -->
          <div 
            ref="viewfinderRef" 
            class="absolute top-0 left-0 w-1/4 h-full border-2 border-white bg-white rounded-2xl pointer-events-none z-10 shadow-[0_0_25px_rgba(255,255,255,0.25)] transform-gpu"
          />

          <!-- 4 Квадранта оптической сетки с тотальной инверсией -->
          <div class="grid grid-cols-4 w-full h-full relative z-20 divide-x divide-white/15">
            <button 
              v-for="(row, index) in posterRows" 
              :key="row.id"
              type="button"
              role="button"
              tabindex="0"
              class="relative w-full h-full flex flex-col items-center justify-center py-1.5 px-0.5 transition-all duration-300 cursor-pointer touch-manipulation"
              :class="activeTabIndex === index 
                ? 'text-black scale-[1.03] font-black' 
                : 'text-white/45 hover:text-white/80 font-bold'"
              @click="selectTab(index)"
            >
              <!-- Угловые перекрестия Opium Style -->
              <span class="absolute top-1 left-1.5 text-[8px] font-mono leading-none transition-opacity duration-300" :class="activeTabIndex === index ? 'opacity-0' : 'opacity-30'">+</span>
              <span class="absolute top-1 right-1.5 text-[8px] font-mono leading-none transition-opacity duration-300" :class="activeTabIndex === index ? 'opacity-0' : 'opacity-30'">+</span>

              <!-- Индекс со слэшами // -->
              <span class="text-[9px] font-mono tracking-widest mb-0.5">0{{ index + 1 }}//</span>
              
              <!-- Заголовок ячейки -->
              <span class="text-[10px] sm:text-xs font-primary uppercase tracking-tight truncate max-w-full px-0.5">
                {{ getQuadrantLabel(index, row.giantText) }}
              </span>
            </button>
          </div>
        </div>

        <!-- Подпись в стиле Opium Underground -->
        <div class="flex items-center justify-center text-[9px] font-mono text-white/35 tracking-[0.25em] uppercase text-center">
          <span>OPIUM CORE // PURE SWISS TYPOGRAPHY</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useEventBus } from '~/composables/useEventBus'
import { posterRows } from '~/data/priceComparison'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit: emitBus, on: onBus, off: offBus } = useEventBus()

const isVisible = ref(false)
const isInteractive = ref(false)
const activeTabIndex = ref(0)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const viewfinderRef = ref<HTMLElement | null>(null)

const activeRow = computed(() => {
  return posterRows[activeTabIndex.value] || posterRows[0]
})

const getQuadrantLabel = (index: number, defaultText: string) => {
  const shortLabels = ['AI•ARCH', 'SENIOR', 'SPEED×2', '0%RISKS']
  return shortLabels[index] || defaultText
}

let openTimeline: gsap.core.Timeline | null = null
let isClosing = false

const selectTab = (index: number) => {
  if (activeTabIndex.value === index) return
  activeTabIndex.value = index

  if (viewfinderRef.value) {
    gsap.killTweensOf(viewfinderRef.value)
    gsap.to(viewfinderRef.value, {
      xPercent: index * 100,
      duration: 0.5,
      ease: 'power3.out'
    })
  }
}

const openModal = () => {
  isClosing = false
  isVisible.value = true
  isInteractive.value = false
  activeTabIndex.value = 0
  emitBus('price-modal-state', { active: true })

  nextTick(() => {
    if (openTimeline) openTimeline.kill()
    openTimeline = gsap.timeline({
      onComplete: () => {
        isInteractive.value = true
        if (contentRef.value) contentRef.value.style.pointerEvents = 'auto'
      }
    })

    if (viewfinderRef.value) {
      gsap.set(viewfinderRef.value, { xPercent: 0 })
    }

    if (containerRef.value) {
      gsap.set(containerRef.value, { opacity: 0 })
      openTimeline.to(containerRef.value, { opacity: 1, duration: 0.25, ease: 'power2.out' }, 0)
    }

    if (contentRef.value) {
      gsap.set(contentRef.value, { opacity: 1 })
    }

    const header = contentRef.value?.querySelector('.modal-header')
    const hero = contentRef.value?.querySelector('.hero-stage')
    const nav = contentRef.value?.querySelector('.viewfinder-section')

    if (header) {
      gsap.set(header, { opacity: 0, y: -12 })
      openTimeline.to(header, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.05)
    }

    if (hero) {
      gsap.set(hero, { opacity: 0, y: 15 })
      openTimeline.to(hero, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, 0.12)
    }

    if (nav) {
      gsap.set(nav, { opacity: 0, y: 15 })
      openTimeline.to(nav, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.22)
    }
  })
}

const closeModal = () => {
  if (isClosing) return
  isClosing = true
  isInteractive.value = false
  emitBus('price-modal-state', { active: false })
  if (contentRef.value) contentRef.value.style.pointerEvents = 'none'
  if (openTimeline) openTimeline.kill()

  openTimeline = gsap.timeline({
    onComplete: () => {
      isVisible.value = false
      emit('close')
    }
  })

  const header = contentRef.value?.querySelector('.modal-header')
  const hero = contentRef.value?.querySelector('.hero-stage')
  const nav = contentRef.value?.querySelector('.viewfinder-section')

  if (nav) {
    openTimeline.to(nav, { opacity: 0, y: 10, duration: 0.16, ease: 'power2.inOut' }, 0)
  }

  if (hero) {
    openTimeline.to(hero, { opacity: 0, y: 10, duration: 0.18, ease: 'power2.inOut' }, 0.04)
  }

  if (header) {
    openTimeline.to(header, { opacity: 0, y: -10, duration: 0.16, ease: 'power2.inOut' }, 0.06)
  }

  if (containerRef.value) {
    openTimeline.to(containerRef.value, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, 0.12)
  }
}

watch(() => props.isOpen, (val) => {
  if (val) {
    openModal()
  } else if (isVisible.value) {
    closeModal()
  }
})

const handleModalClose = () => {
  if (isVisible.value) closeModal()
}

onMounted(() => {
  onBus('price-modal-close', handleModalClose)
})

onBeforeUnmount(() => {
  offBus('price-modal-close', handleModalClose)
  if (isVisible.value) {
    emitBus('price-modal-state', { active: false })
  }
  if (openTimeline) openTimeline.kill()
  if (viewfinderRef.value) {
    gsap.killTweensOf(viewfinderRef.value)
  }
  if (contentRef.value) {
    gsap.killTweensOf(contentRef.value.querySelectorAll('*'))
  }
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
  }
})
</script>

<style scoped>
.fade-stage-enter-active,
.fade-stage-leave-active {
  transition: opacity 0.25s cubic-bezier(0.25, 1, 0.5, 1), transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);
}
.fade-stage-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-stage-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
