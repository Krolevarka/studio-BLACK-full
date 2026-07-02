<template>
  <div ref="wrapperRef" class="organic-core-wrapper absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
    <canvas
ref="canvasRef"
            class="absolute pointer-events-none max-w-none"
            style="top: -80px; left: -80px; transform: translateZ(0); will-change: transform;"/>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import gsap from 'gsap'
import { useOrganicCore } from '~/composables/useOrganicCore'
import { useDeviceSwitch } from '~/composables/useDeviceSwitch'
import { useEventBus } from '~/composables/useEventBus'
import { useSectionTransition } from '~/composables/useSectionTransition'
import { MOBILE_SPHERE_HIDDEN } from '~/utils/sectionLabels'
import { createOrganicGL, type OrganicGL } from '~/composables/organic/useOrganicGL'

const wrapperRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const {
  shapes, stateConfig, isPreloading,
  expandForMenu: expand, collapseFromMenu,
  initOrganicCore, startPreloaderAnimation, destroyOrganicCore
} = useOrganicCore()
const { isMobileOrTablet } = useDeviceSwitch()

let glEngine: OrganicGL | null = null
let time = 0
let pulseTime = 0
let cachedWidth = 1024

// Канвас с «бликом» по краям (+160px), чтобы blur не обрезался у границ вьюпорта (как desktop).
const BLEED = 160

const render = () => {
  if (!glEngine || !glEngine.isReady() || shapes.length === 0) return
  time += 0.01 * (stateConfig.noiseSpeed !== undefined ? stateConfig.noiseSpeed : 1)
  pulseTime += 0.01 * (stateConfig.pulseSpeed ?? 1)
  glEngine.renderFrame(shapes, stateConfig, { time, pulseTime, cachedWidth, isPreloading: isPreloading.value })
}

const resize = () => {
  if (!glEngine) return
  cachedWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  glEngine.resize(window.innerWidth + BLEED, window.innerHeight + BLEED)
}

// ── Видимость сферы на мобильных (порт из desktop OrganicCore) ────────────────
// Прячем РАНО (по section-change), показываем ПОЗДНО (по arrivedLabel, форма устаканилась).
const { on } = useEventBus()
const { arrivedLabel } = useSectionTransition()

const isHiddenTab = (label: string) =>
  isMobileOrTablet.value && MOBILE_SPHERE_HIDDEN.has(label)

let tickerRunning = false
const startTicker = () => {
  if (!tickerRunning) { gsap.ticker.add(render); tickerRunning = true }
}
const stopTicker = () => {
  if (tickerRunning) { gsap.ticker.remove(render); tickerRunning = false }
}

let isVisible = true
let fadeTween: gsap.core.Tween | null = null
let showTimeout: ReturnType<typeof setTimeout> | null = null
let warmupRaf1: number | null = null
let warmupRaf2: number | null = null

const cancelWarmupRafs = () => {
  if (warmupRaf1 !== null) { cancelAnimationFrame(warmupRaf1); warmupRaf1 = null }
  if (warmupRaf2 !== null) { cancelAnimationFrame(warmupRaf2); warmupRaf2 = null }
}

const hideSphere = () => {
  if (showTimeout) { clearTimeout(showTimeout); showTimeout = null }
  cancelWarmupRafs()
  if (!isVisible) return
  isVisible = false
  if (fadeTween) fadeTween.kill()
  if (!wrapperRef.value) { stopTicker(); return }
  fadeTween = gsap.to(wrapperRef.value, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => { if (!isVisible) stopTicker() }
  })
}
const resetPhysics = () => {
  shapes.forEach(shape => {
    const currentX = shape.xOffset + (shape.pulseOffsetX || 0)
    const currentY = shape.yOffset + (shape.pulseOffsetY || 0)
    shape.physX = currentX
    shape.physY = currentY
    shape.defX = 0
    shape.defY = 0
    shape.defVx = 0
    shape.defVy = 0
    shape.lastVx = 0
    shape.lastVy = 0
  })
}

const showSphere = () => {
  if (showTimeout) { clearTimeout(showTimeout); showTimeout = null }
  cancelWarmupRafs()
  if (isVisible) return
  isVisible = true
  resetPhysics()
  startTicker()
  if (fadeTween) fadeTween.kill()
  if (!wrapperRef.value) return

  // Гарантируем полную прозрачность перед стартом анимации и прогревом
  gsap.set(wrapperRef.value, { opacity: 0 })

  // Форсируем 1 синхронный кадр рендера WebGL немедленно при opacity: 0,
  // чтобы скомпилировать шейдеры и загрузить буферы в видеопамять без видимого микро-лага
  render()

  // Даём мобильному GPU 2 кадра (через double rAF) на стабилизацию перед визуальным проявлением
  warmupRaf1 = requestAnimationFrame(() => {
    warmupRaf1 = null
    warmupRaf2 = requestAnimationFrame(() => {
      warmupRaf2 = null
      if (!isVisible || !wrapperRef.value) return

      // Плавное проявление с мягким easing, устраняющее эффект вспышки и резкого скачка
      fadeTween = gsap.to(wrapperRef.value, {
        opacity: 1,
        duration: 1.2,
        ease: 'power2.inOut'
      })
    })
  })
}

const unwatchArrived = watch(arrivedLabel, (label) => {
  if (label !== '' && !isHiddenTab(label)) showSphere()
})

const onVisibilityChange = () => {
  if (typeof document === 'undefined') return
  if (document.hidden) stopTicker()
  else if (isVisible) { resetPhysics(); startTicker() }
}

let preloaderTl: gsap.core.Timeline | null = null

onMounted(() => {
  if (canvasRef.value) {
    glEngine = createOrganicGL(canvasRef.value)
    if (glEngine) {
      resize()
      window.addEventListener('resize', resize)
    } else {
      // Нет WebGL (очень редко на мобиле) — сфера не рендерится, но приложение работает.
      // TODO(Фаза 4): фолбэк на Canvas 2D.
      console.warn('[OrganicCoreMobile] WebGL недоступен — сфера отключена')
    }
  }

  // Инициализация общего состояния и прелоадера (события должны произойти в любом случае)
  initOrganicCore()
  preloaderTl = startPreloaderAnimation()

  on('section-change', (label: string) => {
    if (isHiddenTab(label)) hideSphere()
  })
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  startTicker()
})

onBeforeUnmount(() => {
  if (showTimeout) { clearTimeout(showTimeout); showTimeout = null }
  cancelWarmupRafs()
  unwatchArrived()
  stopTicker()
  if (fadeTween) fadeTween.kill()
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
  window.removeEventListener('resize', resize)
  if (preloaderTl) preloaderTl.kill()
  shapes.forEach(shape => {
    if (shape.pulseTl) { shape.pulseTl.kill(); shape.pulseTl = undefined }
  })
  gsap.killTweensOf(stateConfig)
  shapes.forEach(shape => {
    gsap.killTweensOf(shape)
    shape.points.forEach(p => {
      gsap.killTweensOf(p)
      gsap.killTweensOf(p.normal)
    })
  })
  glEngine?.dispose()
  glEngine = null
  destroyOrganicCore()
})

// На мобильных «тяжёлых» вкладках сфера скрыта — меню без «взрыва» сферы (как в desktop-версии).
const expandForMenu = () => {
  if (isMobileOrTablet.value && !isVisible) return
  expand(wrapperRef.value)
}
const collapseFromMenuSafe = () => {
  if (isMobileOrTablet.value && !isVisible) return
  collapseFromMenu()
}

defineExpose({ expandForMenu, collapseFromMenu: collapseFromMenuSafe })
</script>
