<template>
  <div class="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 select-none pointer-events-none">
    
    <!-- Обертка переключателя и иконки-подсказки -->
    <div class="relative flex items-center justify-center">
      
      <!-- Интерактивная иконка "?" -->
      <button
        ref="questionBtnRef"
        type="button"
        role="button"
        tabindex="0"
        aria-label="Сравнение подходов к разработке"
        class="absolute w-8 h-8 rounded-full border border-white/20 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center text-white/70 hover:text-black hover:bg-white hover:border-white hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto z-20 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6)] opacity-0 group"
        @click="openInfoModal"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.25 5.5C6.25 4.5335 7.0335 3.75 8 3.75C8.9665 3.75 9.75 4.5335 9.75 5.5C9.75 6.2736 9.2471 6.9298 8.5471 7.1631C8.2255 7.2703 8 7.5718 8 7.9104V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="8" cy="11.75" r="0.85" fill="currentColor"/>
        </svg>
      </button>

      <!-- Переключатель пилс с кинетическим глайдером -->
      <div 
        ref="containerRef"
        class="relative flex items-center p-1 rounded-full bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 shadow-[0_10px_35px_rgba(0,0,0,0.85)] overflow-hidden pointer-events-auto z-10"
        role="group"
        aria-label="Выбор режима разработки"
      >
      <!-- Анимированная белая подложка (Glider) -->
      <div 
        ref="gliderRef"
        class="absolute top-1 bottom-1 left-0 rounded-full bg-white shadow-[0_2px_15px_rgba(255,255,255,0.4)] pointer-events-none opacity-0"
      ></div>

      <!-- Кнопка AI-Сборка -->
      <button
        ref="aiBtnRef"
        type="button"
        role="button"
        tabindex="0"
        aria-label="Режим AI-сборка со скидкой 30%"
        class="relative z-10 px-5 md:px-7 py-2.5 rounded-full text-xs md:text-sm font-primary tracking-[0.12em] uppercase transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center gap-2 min-h-[2.75rem] touch-manipulation active:scale-95 cursor-pointer"
        :class="isAiMode ? 'text-black font-bold' : 'text-white/60 hover:text-white font-bold'"
        @click="selectMode('ai')"
        @keydown.enter="selectMode('ai')"
      >
        <span>AI-Сборка</span>
        <span 
          class="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-normal transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] font-bold"
          :class="isAiMode ? 'bg-black/10 text-black border border-transparent' : 'bg-white/10 text-white/80 border border-white/20'"
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
        class="relative z-10 px-5 md:px-7 py-2.5 rounded-full text-xs md:text-sm font-primary tracking-[0.12em] uppercase transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center min-h-[2.75rem] touch-manipulation active:scale-95 cursor-pointer"
        :class="!isAiMode ? 'text-black font-bold' : 'text-white/60 hover:text-white font-bold'"
        @click="selectMode('manual')"
        @keydown.enter="selectMode('manual')"
      >
        Ручная
      </button>
    </div>
  </div>

    <!-- Минималистичное текстовое пояснение без рамок -->
    <div 
      ref="descRef"
      class="mt-3 min-h-[2.4rem] flex items-center justify-center text-center px-4"
    >
      <p v-if="isAiMode" key="ai-desc" class="font-secondary text-xs md:text-sm text-white/75 leading-relaxed max-w-md text-balance">
        AI-генерация кода под контролем Senior-архитекторов. Проект на <span class="text-white font-bold tracking-wide">30% дешевле</span> и в 2 раза быстрее без рисков.
      </p>
      <p v-else key="manual-desc" class="font-secondary text-xs md:text-sm text-white/50 leading-relaxed max-w-md text-balance">
        Классический формат разработки командой инженеров с нуля без применения AI-ускорителей.
      </p>
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
const descRef = ref<HTMLElement | null>(null)
const questionBtnRef = ref<HTMLElement | null>(null)

let resizeObserver: ResizeObserver | null = null

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

  const targetX = isAiMode.value ? -(containerW / 2 + 26) : (containerW / 2 + 26)

  gsap.killTweensOf(btn)

  if (immediate) {
    gsap.set(btn, { x: targetX, opacity: 1, scale: 1 })
  } else {
    const tl = gsap.timeline()
    tl.to(btn, {
      opacity: 0,
      scale: 0.75,
      duration: 0.22,
      ease: 'power2.in'
    })
    tl.set(btn, {
      x: targetX,
      scale: 0.75
    })
    tl.to(btn, {
      opacity: 1,
      scale: 1,
      duration: 0.35,
      ease: 'power2.out'
    })
  }
}

const updateGlider = (immediate = false) => {
  const activeBtn = isAiMode.value ? aiBtnRef.value : manualBtnRef.value
  const glider = gliderRef.value
  if (!activeBtn || !glider) return

  const targetW = activeBtn.offsetWidth
  // Если контейнер скрыт (например, v-show="false" до открытия секции),
  // offsetWidth равен 0. Прячем глайдер, чтобы не было артефактной вертикальной линии.
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

    // Кинетическое вытягивание исключительно за счёт внутреннего конца подложки, 
    // чтобы внешний конец никогда не вылезал за границы целевой кнопки.
    const stretch = Math.min(Math.abs(distance) * 0.22, 24)
    const tl = gsap.timeline()

    if (distance > 0) {
      // Движение вправо (к кнопке Ручная):
      // Правый (ведущий) конец сразу точно приходит на целевую границу (targetX + targetW).
      // Растяжение происходит внутрь за счёт отставания левого конца.
      tl.to(glider, {
        x: targetX - stretch,
        width: targetW + stretch,
        scaleY: 0.96,
        opacity: 1,
        duration: 0.26,
        ease: 'power2.out'
      }, 0)

      tl.to(glider, {
        x: targetX,
        width: targetW,
        scaleY: 1,
        duration: 0.48,
        ease: 'power3.out'
      }, 0.14)
    } else {
      // Движение влево (к кнопке AI-Сборка):
      // Левый (ведущий) конец сразу точно встаёт на целевую границу (targetX).
      // Растяжение происходит внутрь за счёт запаздывания правого конца.
      tl.to(glider, {
        x: targetX,
        width: targetW + stretch,
        scaleY: 0.96,
        opacity: 1,
        duration: 0.26,
        ease: 'power2.out'
      }, 0)

      tl.to(glider, {
        width: targetW,
        scaleY: 1,
        duration: 0.48,
        ease: 'power3.out'
      }, 0.14)
    }
  }
}

const animateDescChange = () => {
  const desc = descRef.value
  if (!desc) return

  gsap.killTweensOf(desc)
  gsap.fromTo(desc,
    { opacity: 0, y: 8, filter: 'blur(6px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out', clearProps: 'filter' }
  )
}

const selectMode = (mode: DevModeType) => {
  if (isAiMode.value === (mode === 'ai')) return
  setMode(mode)
}

let lastKnownWidth = 0

watch(isAiMode, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      updateGlider(false)
      updateQuestionIcon(false)
      animateDescChange()
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

  // Отслеживаем только реальное изменение размеров контейнера (появление из v-show или ресайз окна).
  // Порог > 8px гарантирует, что микро-изменения ширины кнопок при смене font-weight не будут вызывать
  // updateGlider(true) и сбрасывать текущую кинетическую анимацию!
  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        if (newWidth > 0 && Math.abs(newWidth - lastKnownWidth) > 8) {
          lastKnownWidth = newWidth
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
  if (descRef.value) gsap.killTweensOf(descRef.value)
  if (questionBtnRef.value) gsap.killTweensOf(questionBtnRef.value)
})
</script>
