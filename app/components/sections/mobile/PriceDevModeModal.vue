<template>
  <div 
    v-show="isVisible"
    class="fixed inset-0 w-full h-[100dvh] z-[100] overflow-y-auto overflow-x-hidden flex flex-col bg-[#050505] text-white touch-manipulation select-none"
    :class="[isMenuTransitioning ? 'transition-opacity' : '', isMenuOpenLocal ? '!opacity-0 duration-[1000ms]' : '']"
    ref="containerRef"
  >
    <!-- Контент -->
    <div ref="contentRef" class="relative w-full min-h-full opacity-0 pointer-events-none overflow-x-hidden px-6 py-10 flex flex-col justify-center gap-6">
      
      <!-- Кнопка назад -->
      <button 
        class="back-btn fixed top-4 right-4 text-white/60 active:text-white transition-colors z-[110] flex items-center cursor-pointer min-w-[44px] min-h-[44px]"
        :class="isInteractive ? 'pointer-events-auto' : 'pointer-events-none'"
        @click="closeModal"
      >
        <div class="relative w-11 h-11 flex items-center justify-center rounded-full border border-white/20 active:border-white transition-colors duration-300 bg-[#050505]/80 backdrop-blur-md">
          <svg class="w-5 h-5 transform active:-translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </div>
      </button>

      <!-- Заголовок в стиле компактной типографики с линиями -->
      <!-- Заголовок в стиле компактной типографики с линиями -->
      <div class="poster-header relative flex flex-col pb-5">
        <span class="w-fit text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em] mb-1">
          Сравнение // Чистая типографика
        </span>
        <h3 class="font-primary text-2xl font-black text-white uppercase leading-tight tracking-tight">
          Эволюция разработки
        </h3>
        <p class="font-secondary text-xs text-white/60 mt-1.5 leading-relaxed">
          Генерация под надзором <span class="text-white font-bold">Senior-архитекторов</span>: вдвое быстрее и на 30% выгоднее.
        </p>
        <div class="header-line absolute bottom-0 left-0 w-full h-[1px] bg-white/15" :class="posterRows[0]?.align === 'right' ? 'origin-right' : 'origin-left'"></div>
      </div>

      <!-- Компактный швейцарский ритм для мобильных (без обрезки букв) -->
      <div class="poster-canvas flex flex-col w-full">
        <div 
          v-for="(row, index) in posterRows" 
          :key="row.id" 
          class="poster-row relative flex flex-col py-5"
          :class="row.align === 'right' ? 'items-end text-right' : 'items-start text-left'"
        >
          <!-- Гигантское слово/слог (overflow-visible + комфортный line-height) -->
          <div class="giant-letter overflow-visible py-1 w-full" :class="row.align === 'right' ? 'text-right' : 'text-left'">
            <span class="block font-primary font-black uppercase text-[clamp(2.8rem,13vw,4.2rem)] leading-[0.95] tracking-tighter text-white transform-gpu" v-html="formatTypography(row.giantText)"></span>
          </div>

          <!-- Редакционный блок в плотном потоке -->
          <div 
            v-if="row.editorial" 
            class="editorial-block mt-2 max-w-[300px]"
          >
            <div class="flex flex-col" :class="row.align === 'right' ? 'items-end' : 'items-start'">
              <span class="text-[9px] font-mono font-bold text-white/40 tracking-[0.2em] uppercase mb-1">
                {{ row.editorial.tag }}
              </span>
              <h4 class="text-sm font-primary font-black text-white uppercase tracking-tight mb-1">
                {{ row.editorial.headline }}
              </h4>
              <p class="text-[11px] font-secondary text-white/70 leading-relaxed mb-2">
                {{ row.editorial.body }}
              </p>
              <span v-if="row.editorial.stat" class="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-white text-black uppercase tracking-widest">
                {{ row.editorial.stat }}
              </span>
            </div>
          </div>
          <div 
            v-if="index !== posterRows.length - 1" 
            class="row-line absolute bottom-0 left-0 w-full h-[1px] bg-white/15" 
            :class="posterRows[index + 1]?.align === 'right' ? 'origin-right' : 'origin-left'"
          ></div>
        </div>
      </div>

      <!-- Футер плаката -->
      <div class="poster-footer relative pt-5 flex flex-col gap-1 text-[9px] font-mono text-white/40 tracking-widest uppercase text-center">
        <div class="footer-line absolute top-0 left-0 w-full h-[1px] bg-white/15" :class="posterRows[posterRows.length - 1]?.align === 'right' ? 'origin-right' : 'origin-left'"></div>
        <span>STUDIO-BLACK // ARCHITECTURAL AI SYSTEM</span>
        <span>NO BORDERS • PURE TYPOGRAPHY</span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
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
const { emit: emitBus } = useEventBus()

const formatTypography = (text: string) => {
  return text.replace(/•/g, '<span class="inline-block relative -translate-y-[0.1em] text-white mx-2">•</span>')
}

const isVisible = ref(false)
const isInteractive = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

let openTimeline: gsap.core.Timeline | null = null
let isClosing = false

const openModal = () => {
  isClosing = false
  isVisible.value = true
  isInteractive.value = false
  emitBus('price-modal-state', { active: true })

  nextTick(() => {
    if (openTimeline) openTimeline.kill()
    openTimeline = gsap.timeline({
      onComplete: () => {
        isInteractive.value = true
        if (contentRef.value) contentRef.value.style.pointerEvents = 'auto'
      }
    })

    if (containerRef.value) {
      gsap.set(containerRef.value, { opacity: 0 })
      openTimeline.to(containerRef.value, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    }

    if (contentRef.value) {
      gsap.set(contentRef.value, { opacity: 1 })
    }

    const header = contentRef.value?.querySelector('.poster-header')
    const headerLine = contentRef.value?.querySelector('.header-line')
    const footer = contentRef.value?.querySelector('.poster-footer')
    const footerLine = contentRef.value?.querySelector('.footer-line')
    const backBtn = contentRef.value?.querySelector('.back-btn')
    const rows = contentRef.value?.querySelectorAll('.poster-row')

    if (header) {
      gsap.set(header, { clearProps: 'transform,filter', opacity: 0 })
      openTimeline.to(header, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0.05)
    }

    if (headerLine) {
      gsap.set(headerLine, { scaleX: 0, opacity: 1 })
      openTimeline.to(headerLine, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, 0.12)
    }

    if (backBtn) {
      gsap.set(backBtn, { clearProps: 'transform,filter', opacity: 0 })
      openTimeline.to(backBtn, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.08)
    }

    let currentTimelineTime = 0.25

    if (rows && rows.length > 0) {
      rows.forEach((row, index) => {
        const isRight = posterRows[index]?.align === 'right'
        const giantLetter = row.querySelector('.giant-letter span')
        const rowLine = row.querySelector('.row-line')
        const editorial = row.querySelector('.editorial-block')
        const rowStart = currentTimelineTime

        if (giantLetter) {
          gsap.set(giantLetter, { clearProps: 'transform' })
          openTimeline!.fromTo(giantLetter,
            { x: isRight ? '110vw' : '-110vw', opacity: 0, filter: 'blur(16px)' },
            { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out', clearProps: 'filter' },
            rowStart
          )
        }

        if (rowLine) {
          gsap.set(rowLine, { scaleX: 0, opacity: 1 })
          openTimeline!.to(rowLine,
            { scaleX: 1, duration: 0.45, ease: 'power3.inOut' },
            rowStart + 0.28
          )
        }

        if (editorial) {
          gsap.set(editorial, { clearProps: 'transform,filter', opacity: 0 })
          openTimeline!.to(editorial,
            { opacity: 1, duration: 0.45, ease: 'power2.out' },
            rowStart + 0.36
          )
        }

        currentTimelineTime += 0.24
      })
    }

    if (footer || footerLine) {
      const footerStart = currentTimelineTime + 0.08
      if (footerLine) {
        gsap.set(footerLine, { scaleX: 0, opacity: 1 })
        openTimeline.to(footerLine, { scaleX: 1, duration: 0.45, ease: 'power3.inOut' }, footerStart)
      }
      if (footer) {
        gsap.set(footer, { clearProps: 'transform,filter', opacity: 0 })
        openTimeline.to(footer, { opacity: 1, duration: 0.4, ease: 'power2.out' }, footerStart + 0.12)
      }
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

  const header = contentRef.value?.querySelector('.poster-header')
  const headerLine = contentRef.value?.querySelector('.header-line')
  const footer = contentRef.value?.querySelector('.poster-footer')
  const footerLine = contentRef.value?.querySelector('.footer-line')
  const backBtn = contentRef.value?.querySelector('.back-btn')
  const rows = contentRef.value?.querySelectorAll('.poster-row')

  if (backBtn) {
    openTimeline.to(backBtn, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, 0)
  }
  if (footerLine) {
    openTimeline.to(footerLine, { opacity: 0, duration: 0.18, ease: 'power2.inOut' }, 0)
  }
  if (footer) {
    openTimeline.to(footer, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, 0)
  }

  if (rows && rows.length > 0) {
    Array.from(rows).reverse().forEach((row, index) => {
      const giantLetter = row.querySelector('.giant-letter span')
      const editorial = row.querySelector('.editorial-block')
      const rowLine = row.querySelector('.row-line')
      const closeTime = 0.02 + index * 0.04

      if (rowLine) {
        openTimeline!.to(rowLine, { opacity: 0, duration: 0.18, ease: 'power2.inOut' }, closeTime)
      }
      if (editorial) {
        openTimeline!.to(editorial, { opacity: 0, duration: 0.22, ease: 'power2.inOut' }, closeTime)
      }
      if (giantLetter) {
        openTimeline!.to(giantLetter, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, closeTime)
      }
    })
  }

  if (headerLine) {
    openTimeline.to(headerLine, { opacity: 0, duration: 0.18, ease: 'power2.inOut' }, 0.05)
  }
  if (header) {
    openTimeline.to(header, { opacity: 0, duration: 0.22, ease: 'power2.inOut' }, 0.06)
  }

  if (containerRef.value) {
    openTimeline.to(containerRef.value, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0.12)
  }
}

watch(() => props.isOpen, (val) => {
  if (val) {
    openModal()
  } else if (isVisible.value) {
    closeModal()
  }
})

onBeforeUnmount(() => {
  if (isVisible.value) {
    emitBus('price-modal-state', { active: false })
  }
  if (openTimeline) openTimeline.kill()
  if (contentRef.value) {
    gsap.killTweensOf(contentRef.value.querySelectorAll('*'))
  }
  if (containerRef.value) {
    gsap.killTweensOf(containerRef.value)
  }
})
</script>
