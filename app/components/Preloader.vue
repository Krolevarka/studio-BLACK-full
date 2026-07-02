<template>
  <div v-if="isVisible" ref="preloaderRef" class="preloader fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"/>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'

const preloaderRef = ref<HTMLElement | null>(null)
const isVisible = ref(true)

const { on, emit } = useEventBus()

let timeoutId: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (!preloaderRef.value) return
  
  on('finish-preloader', () => {
    gsap.to(preloaderRef.value, {
      opacity: 0,
      duration: 1,
      ease: 'power2.inOut',
      pointerEvents: 'none',
      onComplete: () => {
        emit('preloader-done')
        timeoutId = setTimeout(() => { isVisible.value = false }, 100)
      }
    })
  })
})

onBeforeUnmount(() => {
  if (preloaderRef.value) {
    gsap.killTweensOf(preloaderRef.value)
  }
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
})
</script>

