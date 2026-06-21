<template>
  <div class="scroll-hint flex flex-col items-center pointer-events-none z-20">
    <span ref="textRef" class="font-secondary text-[10px] md:text-xs uppercase tracking-[0.5em] text-white/30 mb-3 ml-[0.5em] select-none">Скролл</span>
    <div class="relative w-[1px] h-[60px] bg-gradient-to-b from-white/20 to-transparent">
      <div ref="dotRef" class="absolute top-0 left-0 w-[1px] h-[12px] bg-white opacity-0"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import gsap from 'gsap'

const textRef = ref<HTMLElement | null>(null)
const dotRef = ref<HTMLElement | null>(null)

let tlDrop: gsap.core.Timeline | null = null

onMounted(() => {
  if (!dotRef.value || !textRef.value) return

  // Одно непрерывное, плавное движение падающей "яркой линии"
  tlDrop = gsap.timeline({ repeat: -1 })
  
  // Падение: стартуем прямо на начале трека
  tlDrop.fromTo(dotRef.value, 
    { y: 0, height: '4px' },
    { y: 60, height: '16px', duration: 1.5, ease: 'power1.in' }
  )
  
  // Прозрачность: загорается при входе в линию сверху, тухнет при выходе снизу
  tlDrop.fromTo(dotRef.value, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power1.inOut' }, 0)
  tlDrop.to(dotRef.value, { opacity: 0, duration: 0.5, ease: 'power1.inOut' }, 1.0)
})

onBeforeUnmount(() => {
  if (tlDrop) tlDrop.kill()
})
</script>

<style scoped>
</style>
