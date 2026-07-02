<template>
  <div class="flex flex-col items-center justify-center w-full select-none pointer-events-none">
    
    <!-- Обертка переключателя и иконки-подсказки -->
    <div class="relative flex items-center justify-center">
      
      <!-- Интерактивная иконка "?" с анимацией перелета -->
      <button
        ref="questionBtnRef"
        type="button"
        role="button"
        tabindex="0"
        aria-label="Сравнение подходов к разработке"
        class="magnetic-btn absolute w-8 h-8 rounded-full border border-white/20 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-transparent hover:border-transparent hover:shadow-none transition-colors duration-300 pointer-events-auto z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6)] opacity-0 focus:outline-none after:content-[''] after:absolute after:-inset-1.5"
        @click="openInfoModal"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.25 5.5C6.25 4.5335 7.0335 3.75 8 3.75C8.9665 3.75 9.75 4.5335 9.75 5.5C9.75 6.2736 9.2471 6.9298 8.5471 7.1631C8.2255 7.2703 8 7.5718 8 7.9104V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="8" cy="11.75" r="0.85" fill="currentColor"/>
        </svg>
      </button>

      <!-- Переключатель пилс (строго по центру экрана) -->
      <div 
        ref="containerRef"
        class="relative flex items-center p-1 rounded-full bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.85)] overflow-hidden pointer-events-auto z-10"
        role="group"
        aria-label="Выбор режима разработки"
      >
        <!-- Анимированная белая подложка (Glider) -->
        <div 
          ref="gliderRef"
          class="absolute top-1 bottom-1 left-0 rounded-full bg-white shadow-[0_2px_15px_rgba(255,255,255,0.4)] pointer-events-none opacity-0"
        />

        <!-- Кнопка AI-Сборка -->
        <button
          ref="aiBtnRef"
          type="button"
          role="button"
          tabindex="0"
          aria-label="Режим AI-сборка со скидкой 30%"
          class="relative z-10 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-primary font-bold tracking-[0.08em] uppercase transition-colors duration-500 flex items-center justify-center gap-1.5 min-h-[2.75rem] touch-manipulation cursor-pointer focus:outline-none"
          :class="isAiMode ? 'text-black' : 'text-white/60 hover:text-white'"
          @click="selectMode('ai')"
          @keydown.enter="selectMode('ai')"
        >
          <span>AI-Сборка</span>
          <span 
            class="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-normal transition-colors duration-500"
            :class="isAiMode ? 'bg-black/10 text-black' : 'bg-white/10 text-white/80'"
          >
            -30%
          </span>
        </button>

        <!-- Кнопка Ручная -->
        <button
          ref="manualBtnRef"
          type="button"
          role="button"
          tabindex="0"
          aria-label="Ручная классическая разработка"
          class="relative z-10 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-primary font-bold tracking-[0.08em] uppercase transition-colors duration-500 flex items-center justify-center min-h-[2.75rem] touch-manipulation cursor-pointer focus:outline-none"
          :class="!isAiMode ? 'text-black' : 'text-white/60 hover:text-white'"
          @click="selectMode('manual')"
          @keydown.enter="selectMode('manual')"
        >
          Ручная
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { usePriceDevMode, type DevModeType } from '~/composables/usePriceDevMode'
import { useEventBus } from '~/composables/useEventBus'

const { isAiMode, setMode } = usePriceDevMode()
const { emit } = useEventBus()

const containerRef = ref<HTMLElement | null>(null)
const gliderRef = ref<HTMLElement | null>(null)
const aiBtnRef = ref<HTMLElement | null>(null)
const manualBtnRef = ref<HTMLElement | null>(null)
const questionBtnRef = ref<HTMLElement | null>(null)

let resizeObserver: ResizeObserver | null = null
let lastKnownWidth = 0

const openInfoModal = () => {
  emit('price-modal-state', { active: true })
}

const updateQuestionIcon = (immediate = false) => {
  const container = containerRef.value
  const btn = questionBtnRef.value
  if (!container || !btn) return

  const containerW = container.offsetWidth
  if (containerW === 0) {
    gsap.set(btn, { opacity: 0 })
    return
  }

  // На мобильном устройстве аккуратный отступ: половина ширины пилса + половина иконки (16px) + отступ (6px) = +22px
  const targetX = isAiMode.value ? -(containerW / 2 + 22) : (containerW / 2 + 22)

  gsap.killTweensOf(btn)

  if (immediate) {
    gsap.set(btn, { x: targetX, opacity: 1, scale: 1 })
  } else {
    const tl = gsap.timeline()
    tl.to(btn, {
      opacity: 0,
      scale: 0.75,
      duration: 0.2,
      ease: 'power2.in'
    })
    tl.set(btn, {
      x: targetX,
      scale: 0.75
    })
    tl.to(btn, {
      opacity: 1,
      scale: 1,
      duration: 0.32,
      ease: 'power2.out'
    })
  }
}

const updateGlider = (immediate = false) => {
  const activeBtn = isAiMode.value ? aiBtnRef.value : manualBtnRef.value
  const glider = gliderRef.value
  if (!activeBtn || !glider) return

  const targetW = activeBtn.offsetWidth
  if (targetW === 0) {
    gsap.set(glider, { opacity: 0 })
    return
  }

  const targetX = activeBtn.offsetLeft

  gsap.killTweensOf(glider)

  if (immediate) {
    gsap.set(glider, { x: targetX, width: targetW, scaleY: 1, opacity: 1 })
  } else {
    const currentX = (gsap.getProperty(glider, 'x') as number) ?? targetX
    const distance = targetX - currentX

    if (Math.abs(distance) < 5) {
      gsap.to(glider, { x: targetX, width: targetW, scaleY: 1, opacity: 1, duration: 0.45, ease: 'power3.out' })
      return
    }

    const stretch = Math.min(Math.abs(distance) * 0.22, 20)
    const tl = gsap.timeline()

    if (distance > 0) {
      tl.to(glider, {
        x: targetX - stretch,
        width: targetW + stretch,
        scaleY: 0.96,
        opacity: 1,
        duration: 0.24,
        ease: 'power2.out'
      }, 0)

      tl.to(glider, {
        x: targetX,
        width: targetW,
        scaleY: 1,
        duration: 0.46,
        ease: 'power3.out'
      }, 0.12)
    } else {
      tl.to(glider, {
        x: targetX,
        width: targetW + stretch,
        scaleY: 0.96,
        opacity: 1,
        duration: 0.24,
        ease: 'power2.out'
      }, 0)

      tl.to(glider, {
        width: targetW,
        scaleY: 1,
        duration: 0.46,
        ease: 'power3.out'
      }, 0.12)
    }
  }
}

const selectMode = (mode: DevModeType) => {
  if (isAiMode.value === (mode === 'ai')) return
  setMode(mode)
}

watch(isAiMode, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      updateGlider(false)
      updateQuestionIcon(false)
    })
  })
})

onMounted(() => {
  nextTick(() => {
    if (containerRef.value) {
      lastKnownWidth = containerRef.value.offsetWidth
    }
    updateGlider(true)
    updateQuestionIcon(true)
  })

  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        if (newWidth > 0 && Math.abs(newWidth - lastKnownWidth) > 6) {
          lastKnownWidth = newWidth
          if (questionBtnRef.value && gsap.isTweening(questionBtnRef.value)) return
          if (gliderRef.value && gsap.isTweening(gliderRef.value)) return
          updateGlider(true)
          updateQuestionIcon(true)
        }
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (gliderRef.value) gsap.killTweensOf(gliderRef.value)
  if (questionBtnRef.value) gsap.killTweensOf(questionBtnRef.value)
})
</script>
