<template>
  <div 
    ref="containerRef"
    class="flex items-center p-1 rounded-full bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.8)] relative overflow-hidden select-none w-max max-w-full"
    role="group"
    aria-label="Выбор режима разработки"
  >
    <!-- Анимированная белая подложка (Glider) -->
    <div 
      ref="gliderRef"
      class="absolute top-1 bottom-1 left-0 rounded-full bg-white shadow-[0_2px_15px_rgba(255,255,255,0.35)] pointer-events-none opacity-0"
    />

    <!-- Кнопка AI -->
    <button
      ref="aiBtnRef"
      type="button"
      role="button"
      tabindex="0"
      aria-label="Режим AI"
      class="relative z-10 px-5 py-2.5 rounded-full text-xs font-primary tracking-[0.14em] uppercase transition-colors duration-500 min-h-[2.75rem] flex items-center justify-center cursor-pointer focus:outline-none touch-manipulation active:scale-95"
      :class="modelValue === 'ai' ? 'text-black font-bold' : 'text-white/60 hover:text-white font-semibold'"
      @click="selectMode('ai')"
      @keydown.enter="selectMode('ai')"
    >
      AI
    </button>

    <!-- Кнопка Ручная -->
    <button
      ref="manualBtnRef"
      type="button"
      role="button"
      tabindex="0"
      aria-label="Режим Ручная"
      class="relative z-10 px-5 py-2.5 rounded-full text-xs font-primary tracking-[0.14em] uppercase transition-colors duration-500 min-h-[2.75rem] flex items-center justify-center cursor-pointer focus:outline-none touch-manipulation active:scale-95"
      :class="modelValue === 'manual' ? 'text-black font-bold' : 'text-white/60 hover:text-white font-semibold'"
      @click="selectMode('manual')"
      @keydown.enter="selectMode('manual')"
    >
      Ручная
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import type { DevModeType } from '~/composables/usePriceDevMode'

const props = defineProps<{
  modelValue: DevModeType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: DevModeType): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const gliderRef = ref<HTMLElement | null>(null)
const aiBtnRef = ref<HTMLElement | null>(null)
const manualBtnRef = ref<HTMLElement | null>(null)

let resizeObserver: ResizeObserver | null = null
let lastKnownWidth = 0

const updateGlider = (immediate = false) => {
  const activeBtn = props.modelValue === 'ai' ? aiBtnRef.value : manualBtnRef.value
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
  if (props.modelValue === mode) return
  emit('update:modelValue', mode)
}

watch(() => props.modelValue, () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      updateGlider(false)
    })
  })
})

onMounted(() => {
  nextTick(() => {
    if (containerRef.value) {
      lastKnownWidth = containerRef.value.offsetWidth
    }
    updateGlider(true)
  })

  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        if (newWidth > 0 && Math.abs(newWidth - lastKnownWidth) > 6) {
          lastKnownWidth = newWidth
          if (gliderRef.value && gsap.isTweening(gliderRef.value)) return
          updateGlider(true)
        }
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  if (gliderRef.value) gsap.killTweensOf(gliderRef.value)
})
</script>
