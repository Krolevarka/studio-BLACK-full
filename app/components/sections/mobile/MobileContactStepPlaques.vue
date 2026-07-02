<template>
  <div 
    ref="viewportRef"
    class="w-full"
    :class="enableCustomScroll ? 'h-full relative overflow-hidden touch-manipulation select-none no-swipe' : ''"
    :data-lenis-prevent="enableCustomScroll ? true : undefined"
    @touchstart="enableCustomScroll ? onTouchStart($event) : undefined"
    @touchmove="enableCustomScroll ? onTouchMove($event) : undefined"
    @touchend="enableCustomScroll ? onTouchEnd($event) : undefined"
  >
    <!-- Верхний градиент для мягкого растворения плашек при скролле -->
    <div
v-if="enableCustomScroll && hasOverflow && scrollY < -4" 
         class="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-[#050505] to-transparent z-[20] pointer-events-none transition-opacity duration-300"/>

    <!-- Нижний градиент для мягкого растворения снизу -->
    <div
v-if="enableCustomScroll && hasOverflow && scrollY > -maxScrollDisplay + 4" 
         class="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#050505] to-transparent z-[20] pointer-events-none transition-opacity duration-300"/>

    <div 
      ref="contentRef"
      class="w-full grid grid-cols-1 gap-2"
      :class="enableCustomScroll ? 'will-change-transform pb-6' : ''"
    >
      <button 
        v-for="opt in options" 
        :key="opt"
        class="w-full min-h-[3rem] px-4 py-3 rounded-[1rem] border transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] font-secondary text-[0.875rem] text-left touch-manipulation active:scale-[0.98]"
        :class="isSelected(opt) ? 'bg-white text-black border-transparent shadow-[0_0_20px_rgba(255,255,255,0.2)] font-bold' : 'bg-white/5 text-white border-white/10 hover:bg-white/10 active:bg-white/20'"
        @click="handleClick(opt)"
      >
        <div class="flex items-center justify-between gap-3">
          <span class="leading-snug">{{ opt }}</span>
          <div
class="w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 shrink-0"
               :class="isSelected(opt) ? 'border-black bg-black' : 'border-white/30'">
            <div
class="w-2 h-2 rounded-full bg-white transition-transform duration-300"
                 :class="isSelected(opt) ? 'scale-100' : 'scale-0'"/>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'

const props = defineProps<{
  options: string[]
  selectedOptions: string | string[]
  enableCustomScroll?: boolean
}>()

const emit = defineEmits(['toggle'])

const viewportRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

const scrollY = ref(0)
const maxScrollDisplay = ref(0)
const hasOverflow = ref(false)

// Обычные JS-переменные (защита от реактивности для 60fps)
let startY = 0
let currentScrollY = 0
let maxScrollVal = 0
let isDragging = false
let isDidDrag = false
let lastY = 0
let lastTime = 0
let velocity = 0
let resizeObserver: ResizeObserver | null = null

const calculateMaxScroll = () => {
  if (contentRef.value && viewportRef.value && props.enableCustomScroll) {
    maxScrollVal = Math.max(0, contentRef.value.scrollHeight - viewportRef.value.clientHeight)
    maxScrollDisplay.value = maxScrollVal
    hasOverflow.value = maxScrollVal > 2
  } else {
    maxScrollVal = 0
    maxScrollDisplay.value = 0
    hasOverflow.value = false
  }
}

const onTouchStart = (e: TouchEvent) => {
  if (!props.enableCustomScroll) return
  e.stopPropagation()
  calculateMaxScroll()
  if (maxScrollVal <= 0) return

  isDragging = true
  isDidDrag = false
  startY = e.touches[0]?.clientY ?? 0
  lastY = startY
  lastTime = performance.now()
  velocity = 0

  if (contentRef.value) {
    gsap.killTweensOf(contentRef.value)
    const currentY = gsap.getProperty(contentRef.value, 'y') as number
    if (!isNaN(currentY)) {
      currentScrollY = currentY
      scrollY.value = currentScrollY
    }
  }
}

const onTouchMove = (e: TouchEvent) => {
  if (!props.enableCustomScroll) return
  e.stopPropagation()
  if (!isDragging) return

  const y = e.touches[0]?.clientY ?? 0
  if (Math.abs(y - startY) > 6) {
    isDidDrag = true
  }

  const now = performance.now()
  const dt = now - lastTime

  if (dt > 0) {
    const instantVel = (y - lastY) / dt
    velocity = velocity * 0.7 + instantVel * 0.3
  }
  lastY = y
  lastTime = now

  const deltaY = y - startY
  startY = y

  currentScrollY += deltaY
  calculateMaxScroll()

  let renderY = currentScrollY
  if (currentScrollY > 0) {
    renderY = currentScrollY * 0.35
  } else if (currentScrollY < -maxScrollVal) {
    const over = currentScrollY + maxScrollVal
    renderY = -maxScrollVal + over * 0.35
  }

  scrollY.value = renderY
  if (contentRef.value) {
    gsap.set(contentRef.value, { y: renderY })
  }
}

const onTouchEnd = (e?: TouchEvent) => {
  if (!props.enableCustomScroll) return
  if (e) e.stopPropagation()
  if (!isDragging) return
  isDragging = false

  if (performance.now() - lastTime > 80) {
    velocity = 0
  }

  calculateMaxScroll()

  const momentum = velocity * 220
  let targetY = currentScrollY + momentum

  if (targetY > 0) {
    targetY = 0
  } else if (targetY < -maxScrollVal) {
    targetY = -maxScrollVal
  }

  currentScrollY = targetY
  scrollY.value = targetY

  const duration = Math.min(1.4, Math.max(0.6, Math.abs(velocity) * 0.45))

  if (contentRef.value) {
    gsap.to(contentRef.value, {
      y: targetY,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        if (contentRef.value) {
          const val = gsap.getProperty(contentRef.value, 'y') as number
          if (!isNaN(val)) scrollY.value = val
        }
      }
    })
  }
}

const handleClick = (opt: string) => {
  if (props.enableCustomScroll && isDidDrag) {
    isDidDrag = false
    return
  }
  emit('toggle', opt)
}

const isSelected = (opt: string) => {
  if (Array.isArray(props.selectedOptions)) {
    return props.selectedOptions.includes(opt)
  }
  return props.selectedOptions === opt
}

watch(() => [props.options, props.enableCustomScroll], () => {
  nextTick(() => {
    calculateMaxScroll()
    if (!props.enableCustomScroll && contentRef.value) {
      gsap.killTweensOf(contentRef.value)
      gsap.set(contentRef.value, { y: 0 })
      currentScrollY = 0
      scrollY.value = 0
    }
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    calculateMaxScroll()
  })

  if (typeof ResizeObserver !== 'undefined' && viewportRef.value) {
    resizeObserver = new ResizeObserver(() => {
      calculateMaxScroll()
    })
    resizeObserver.observe(viewportRef.value)
  }
})

onBeforeUnmount(() => {
  if (contentRef.value) {
    gsap.killTweensOf(contentRef.value)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
.touch-manipulation {
  touch-action: none;
}
</style>
