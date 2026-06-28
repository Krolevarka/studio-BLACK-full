<template>
  <component 
    :is="to ? 'NuxtLink' : 'div'" 
    :role="to ? undefined : 'button'"
    :tabindex="to ? undefined : '0'"
    :to="to" 
    ref="btnRef"
    @click="handleBtnClick"
    @keydown.enter="handleBtnClick"
    @keydown.space.prevent="handleBtnClick"
    @mousedown="handleMouseDown"
    @mouseup="handleMouseUp"
    @touchstart="handleMouseDown"
    @touchend="handleMouseUp"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    :class="[
      'group relative isolate inline-flex items-center justify-center gap-4 rounded-full px-8 py-3.5 min-h-[44px] min-w-[44px] touch-manipulation overflow-hidden transition-colors transition-shadow transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
      variant === 'default' ? 'bg-black/40 border border-white/10 text-white hover:border-white/25 hover:shadow-[0_0_20px_rgba(255,255,255,0.03)]' : '',
      variant === 'accent' ? 'bg-white text-black border border-transparent hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]' : ''
    ]"
  >
    <!-- Текст с мягким параллаксом -->
    <span ref="textRef" class="relative z-10 font-semibold tracking-[0.1em] uppercase text-[clamp(10px,1vw,12px)] pointer-events-none transition-colors duration-500"
          :class="variant === 'accent' ? 'text-black group-hover:text-black/80' : 'group-hover:text-white'">
      <slot />
    </span>
    
    <!-- Иконка с элегантным поворотом -->
    <div ref="iconRef" class="relative z-10 flex items-center justify-center pointer-events-none">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[-45deg] group-hover:translate-x-1 group-hover:-translate-y-0.5">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </svg>
    </div>
  </component>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, type ComponentPublicInstance } from 'vue'
import { useState } from '#imports'
import gsap from 'gsap'

const props = withDefaults(defineProps<{
  to?: string
  variant?: 'default' | 'accent'
}>(), {
  variant: 'default'
})

const btnRef = ref<HTMLElement | ComponentPublicInstance | null>(null)
const textRef = ref<HTMLElement | null>(null)
const iconRef = ref<HTMLElement | null>(null)

const isPageAnimating = useState('isAnimating', () => false)
const isHovered = ref(false)

import { useEventBus } from '~/composables/useEventBus'

const { emit } = useEventBus()

const getBtnElement = () => {
  const val = btnRef.value
  if (!val) return null
  return ('$el' in val) ? (val.$el as HTMLElement) : (val as HTMLElement)
}

const handleBtnClick = (e: Event) => {
  if (props.to && props.to.startsWith('#')) {
    e.preventDefault()
    emit('nav-goto', props.to)
  }
}

let xTo: gsap.QuickToFunc | undefined, yTo: gsap.QuickToFunc | undefined
let textXTo: gsap.QuickToFunc | undefined, textYTo: gsap.QuickToFunc | undefined
let iconXTo: gsap.QuickToFunc | undefined, iconYTo: gsap.QuickToFunc | undefined

let currentRect: DOMRect | null = null
let isTouchDevice = false

onMounted(() => {
  isTouchDevice = window.matchMedia('(pointer: coarse)').matches

  const btn = getBtnElement()
  if (!btn) return

  if (isTouchDevice) return
  
  xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3.out' })
  yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3.out' })
  
  textXTo = gsap.quickTo(textRef.value, 'x', { duration: 0.4, ease: 'power3.out' })
  textYTo = gsap.quickTo(textRef.value, 'y', { duration: 0.4, ease: 'power3.out' })
  
  iconXTo = gsap.quickTo(iconRef.value, 'x', { duration: 0.8, ease: 'power3.out' })
  iconYTo = gsap.quickTo(iconRef.value, 'y', { duration: 0.8, ease: 'power3.out' })
  
  window.addEventListener('resize', handleResize)
  window.addEventListener('wheel', resetButtonOffset, { passive: true })
  window.addEventListener('touchmove', resetButtonOffset, { passive: true })
})

const handleResize = () => {
  currentRect = null
}

const handleMouseDown = () => {
  const btn = getBtnElement()
  if (btn) gsap.to(btn, { scale: 0.95, duration: 0.1, ease: 'power2.out', overwrite: 'auto' })
}

const handleMouseUp = () => {
  const btn = getBtnElement()
  if (btn) gsap.to(btn, { scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
}

const handleMouseEnter = () => {
  if (isTouchDevice || isPageAnimating.value) return
  isHovered.value = true
  const btn = getBtnElement()
  if (!btn) return
  
  currentRect = btn.getBoundingClientRect()
}

const handleMouseMove = (e: MouseEvent) => {
  if (isTouchDevice || isPageAnimating.value) return
  
  const btn = getBtnElement()
  if (!btn) return
  
  const rect = btn.getBoundingClientRect()
  const currentX = gsap.getProperty(btn, 'x') as number || 0
  const currentY = gsap.getProperty(btn, 'y') as number || 0
  
  // Вычисляем базовую позицию кнопки без учета текущего сдвига GSAP
  const baseLeft = rect.left - currentX
  const baseTop = rect.top - currentY
  
  const mouseX = e.clientX - baseLeft
  const mouseY = e.clientY - baseTop
  
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  const distX = mouseX - centerX
  const distY = mouseY - centerY
  
  xTo?.(distX * 0.15)
  yTo?.(distY * 0.15)
  
  textXTo?.(distX * 0.1)
  textYTo?.(distY * 0.1)
  
  iconXTo?.(distX * 0.2)
  iconYTo?.(distY * 0.2)
  
}

const handleMouseLeave = () => {
  isHovered.value = false
  const btn = getBtnElement()
  if (btn) gsap.to(btn, { scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
  if (isTouchDevice || !xTo) return
  xTo?.(0)
  yTo?.(0)
  textXTo?.(0)
  textYTo?.(0)
  iconXTo?.(0)
  iconYTo?.(0)
}

const resetButtonOffset = () => {
  if (!isHovered.value) return
  handleMouseLeave()
}

watch(isPageAnimating, (animating) => {
  if (animating) resetButtonOffset()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('wheel', resetButtonOffset)
  window.removeEventListener('touchmove', resetButtonOffset)
  
  const btn = getBtnElement()
  if (btn) gsap.killTweensOf(btn)
  if (textRef.value) gsap.killTweensOf(textRef.value)
  if (iconRef.value) gsap.killTweensOf(iconRef.value)
})
</script>
