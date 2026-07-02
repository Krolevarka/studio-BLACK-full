<template>
  <div 
    v-show="isVisible"
    ref="containerRef"
    class="absolute inset-0 w-full h-full z-50 overflow-y-auto overflow-x-hidden flex flex-col bg-[#050505] text-white select-none"
    :class="[isMenuTransitioning ? 'transition-opacity' : '', isMenuOpenLocal ? '!opacity-0 duration-[1000ms]' : '']"
  >
    <!-- Контент -->
    <div ref="contentRef" class="relative z-10 flex flex-col w-full min-h-full opacity-0 pointer-events-none px-6 md:px-12 xl:px-20 py-[clamp(1rem,2.5dvh,3rem)] justify-center my-auto gap-[clamp(0.5rem,1.5dvh,1.5rem)]">
      
      <!-- Заголовок модального окна (Компактный швейцарский стиль с линиями сетки) -->
      <div class="poster-header relative flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 pb-[clamp(0.5rem,1.5dvh,1.5rem)] shrink-0">
        <div class="flex flex-col max-w-xl pr-14 md:pr-0">
          <span class="text-[11px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] mb-2">
            Сравнение подходов // Чистая типографика
          </span>
          <h3 class="font-primary text-[clamp(1.4rem,min(2.5vw,4dvh),2.8rem)] font-black text-white uppercase leading-[1.05] tracking-tight">
            Эволюция разработки
          </h3>
        </div>
        <div class="max-w-md md:text-right">
          <p class="font-secondary text-xs text-white/60 leading-relaxed">
            Генерация кода под контролем <span class="text-white font-bold">Senior-архитекторов</span>: вдвое быстрее, на 30% выгоднее и с нулевым техническим долгом.
          </p>
        </div>
        <div class="header-line absolute bottom-0 left-0 w-full h-[1px] bg-white/15" :class="posterRows[0]?.align === 'right' ? 'origin-right' : 'origin-left'"/>
      </div>

      <!-- Компактный швейцарский плакат: чистая типографика без обрезки букв -->
      <div class="poster-canvas flex flex-col justify-center w-full">
        <div 
          v-for="(row, index) in posterRows" 
          :key="row.id" 
          class="poster-row relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-[clamp(1rem,2vw,2.5rem)] w-full py-[clamp(0.35rem,1.3dvh,1.5rem)]"
          :class="row.align === 'right' ? 'md:flex-row-reverse' : ''"
        >
          <!-- Гигантское слово/слог (без overflow-hidden, с комфортным line-height чтобы ничего не обрезалось) -->
          <div class="giant-letter shrink-0 overflow-visible py-1">
            <!-- Контент статический (локальные данные), пользовательский ввод сюда не попадает -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="block font-primary font-black uppercase text-[clamp(1.8rem,min(5vw,6dvh),7.5rem)] leading-[0.95] tracking-tighter text-white transition-colors duration-300 hover:text-white/90" v-html="formatTypography(row.giantText)"/>
          </div>

          <!-- Редакционный блок в едином плотном ритме -->
          <div 
            v-if="row.editorial" 
            class="editorial-block max-w-md xl:max-w-xl shrink-0"
            :class="row.align === 'right' ? 'md:text-left' : 'md:text-right'"
          >
            <div class="flex flex-col" :class="row.align === 'right' ? 'md:items-start' : 'md:items-end'">
              <span class="text-[10px] font-mono font-bold text-white/50 tracking-[0.25em] uppercase mb-[clamp(0.1rem,0.5dvh,0.35rem)]">
                {{ row.editorial.tag }}
              </span>
              <h4 class="text-[clamp(0.9rem,min(1.2vw,1.8dvh),1.15rem)] font-primary font-bold text-white uppercase tracking-tight mb-[clamp(0.15rem,0.5dvh,0.35rem)] leading-tight">
                {{ row.editorial.headline }}
              </h4>
              <p class="text-[clamp(11px,min(0.9vw,1.4dvh),13px)] font-secondary text-white/70 leading-snug mb-[clamp(0.25rem,0.8dvh,0.5rem)]">
                {{ row.editorial.body }}
              </p>
              <span v-if="row.editorial.stat" class="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-white text-black uppercase tracking-widest inline-block">
                {{ row.editorial.stat }}
              </span>
            </div>
          </div>
          <div 
            v-if="index !== posterRows.length - 1" 
            class="row-line absolute bottom-0 left-0 w-full h-[1px] bg-white/15" 
            :class="posterRows[index + 1]?.align === 'right' ? 'origin-right' : 'origin-left'"
          />
        </div>
      </div>

      <!-- Футер плаката -->
      <div class="poster-footer relative pt-[clamp(0.5rem,1.5dvh,1.5rem)] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-white/40 tracking-widest uppercase shrink-0 gap-2">
        <div class="footer-line absolute top-0 left-0 w-full h-[1px] bg-white/15" :class="posterRows[posterRows.length - 1]?.align === 'right' ? 'origin-right' : 'origin-left'"/>
        <span>STUDIO-BLACK // ARCHITECTURAL AI SYSTEM</span>
        <span>NO BORDERS • PURE TYPOGRAPHY</span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
const { emit: emitBus, on: onBus } = useEventBus()

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
      openTimeline.to(containerRef.value, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 0)
    }

    if (contentRef.value) {
      gsap.set(contentRef.value, { opacity: 1 })
    }

    const header = contentRef.value?.querySelector('.poster-header')
    const headerLine = contentRef.value?.querySelector('.header-line')
    const footer = contentRef.value?.querySelector('.poster-footer')
    const footerLine = contentRef.value?.querySelector('.footer-line')
    const rows = contentRef.value?.querySelectorAll('.poster-row')

    if (header) {
      gsap.set(header, { clearProps: 'transform,filter', opacity: 0 })
      openTimeline.to(header, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.05)
    }

    if (headerLine) {
      gsap.set(headerLine, { scaleX: 0, opacity: 1 })
      openTimeline.to(headerLine, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, 0.15)
    }

    let currentTimelineTime = 0.32

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
            { x: 0, opacity: 1, filter: 'blur(0px)', duration: 0.75, ease: 'power3.out', clearProps: 'filter' },
            rowStart
          )
        }

        if (rowLine) {
          gsap.set(rowLine, { scaleX: 0, opacity: 1 })
          openTimeline!.to(rowLine,
            { scaleX: 1, duration: 0.55, ease: 'power3.inOut' },
            rowStart + 0.35
          )
        }

        if (editorial) {
          gsap.set(editorial, { clearProps: 'transform,filter', opacity: 0 })
          openTimeline!.to(editorial,
            { opacity: 1, duration: 0.5, ease: 'power2.out' },
            rowStart + 0.45
          )
        }

        currentTimelineTime += 0.3
      })
    }

    if (footer || footerLine) {
      const footerStart = currentTimelineTime + 0.1
      if (footerLine) {
        gsap.set(footerLine, { scaleX: 0, opacity: 1 })
        openTimeline.to(footerLine, { scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, footerStart)
      }
      if (footer) {
        gsap.set(footer, { clearProps: 'transform,filter', opacity: 0 })
        openTimeline.to(footer, { opacity: 1, duration: 0.45, ease: 'power2.out' }, footerStart + 0.15)
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
    openTimeline.to(backBtn, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0)
  }
  if (footerLine) {
    openTimeline.to(footerLine, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, 0)
  }
  if (footer) {
    openTimeline.to(footer, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0)
  }

  if (rows && rows.length > 0) {
    Array.from(rows).reverse().forEach((row, index) => {
      const giantLetter = row.querySelector('.giant-letter span')
      const editorial = row.querySelector('.editorial-block')
      const rowLine = row.querySelector('.row-line')
      const closeTime = 0.02 + index * 0.04

      if (rowLine) {
        openTimeline!.to(rowLine, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, closeTime)
      }
      if (editorial) {
        openTimeline!.to(editorial, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, closeTime)
      }
      if (giantLetter) {
        openTimeline!.to(giantLetter, { opacity: 0, duration: 0.28, ease: 'power2.inOut' }, closeTime)
      }
    })
  }

  if (headerLine) {
    openTimeline.to(headerLine, { opacity: 0, duration: 0.2, ease: 'power2.inOut' }, 0.05)
  }
  if (header) {
    openTimeline.to(header, { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 0.08)
  }

  if (containerRef.value) {
    openTimeline.to(containerRef.value, { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, 0.15)
  }
}

watch(() => props.isOpen, (val) => {
  if (val) {
    openModal()
  } else if (isVisible.value) {
    closeModal()
  }
})

onMounted(() => {
  onBus('price-modal-close', () => {
    if (isVisible.value) closeModal()
  })
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
