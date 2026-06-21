<template>
  <div v-if="isVisible" ref="preloaderRef" class="preloader fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'

const preloaderRef = ref<HTMLElement | null>(null)
const isVisible = ref(true)

const { on, emit } = useEventBus()

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
        setTimeout(() => { isVisible.value = false }, 100)
      }
    })
  })
})
</script>

