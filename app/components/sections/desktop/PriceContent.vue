<template>
  <section ref="priceRef" v-bind="$attrs" class="relative h-dvh w-full overflow-hidden pt-20 md:pt-0 bg-transparent">
    <!-- Instruction Helper -->
    <div 
      class="absolute top-24 md:top-12 left-0 w-full flex justify-center z-10 pointer-events-none"
      :class="[
        isMenuTransitioning ? 'transition-all' : 'transition-all duration-500',
        hintState === 'hidden' ? 'opacity-0 scale-95' : 'opacity-100 scale-100', 
        isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
      ]"
    >
      <div class="price-anim-target w-full flex justify-center">
        <Transition name="fade" mode="out-in">
          <div 
            v-if="hintState === 'initial'"
            class="text-[clamp(10px,1vw,14px)] text-white/50 tracking-widest uppercase font-secondary px-4 text-center"
          >
            {{ isMobile ? 'Нажмите на модуль, чтобы добавить его в проект' : 'Перетащите модули в центр, чтобы собрать проект' }}
          </div>
          <div 
            v-else-if="hintState === 'remove'"
            class="text-[clamp(10px,1vw,14px)] text-white/50 tracking-widest uppercase font-secondary px-4 text-center"
          >
            Нажмите на сферу в центре, чтобы удалить последний модуль
          </div>
        </Transition>
      </div>
    </div>

    <div 
      v-show="isPriceVisible"
      class="fixed inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-white"
      :class="[
        isMenuTransitioning ? 'transition-opacity' : '',
        isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
      ]"
    >
      <div class="price-heavy-target flex flex-col items-center justify-center w-full h-full pointer-events-none">
        <PriceCoreDisplay 
          class="mix-blend-difference transform-gpu"
          :is-active="isPriceActive"
          :display-price="displayPrice"
          @unselect-last="unselectLast"
        />
        
        <!-- Submit Button -->
        <div 
          class="absolute mt-[35vh] md:mt-[15rem] pointer-events-none transition-all duration-300 z-20 mix-blend-difference transform-gpu"
          :class="totalPrice > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
        >
          <UiButton 
            class="magnetic-btn !border-white hover:!border-transparent transition-all duration-300 !bg-transparent price-collision-obstacle"
            :class="(isPriceActive && totalPrice > 0) ? 'pointer-events-auto' : 'pointer-events-none'"
            @click.stop="submitProject"
          >
            Утвердить проект
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Options Satellites -->
    <!-- z-20 above everything, localized mix-blend-difference transform-gpu to invert color over the white canvas blobs -->
    <div v-show="isPriceVisible" class="fixed inset-0 z-20 pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      <div class="price-heavy-target fixed inset-0 z-20 pointer-events-none">
        <PriceSatellite
          v-for="opt in options"
          :key="opt.id"
          class="price-satellite mix-blend-difference transform-gpu"
          :option="opt"
          :is-active="isPriceActive"
          :ref="(el) => registerOptionRef(opt.id, (el as import('vue').ComponentPublicInstance)?.$el as HTMLElement)"
          @start-drag="startDrag"
          @select="opt.selected = true; updateOrganic()"
          @hover="hoverOption"
        />
      </div>
    </div>

    <!-- Desktop Hover Description -->
    <div class="hidden md:block absolute inset-0 z-10 pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
         ]">
      <div class="price-anim-target absolute inset-0 w-full h-full pointer-events-none">
        <Transition name="blur" mode="out-in">
          <div 
            v-if="activeHoverOption" 
            :key="activeHoverOption.id"
            class="absolute top-1/2 -translate-y-1/2 text-white flex flex-col"
            :class="Math.cos(activeHoverOption.angle) > 0 ? 'right-6 md:right-10 xl:right-24 items-end text-right' : 'left-6 md:left-10 xl:left-24 items-start text-left'"
          >
            <h3 class="text-[clamp(1.5rem,2.8vw,3rem)] font-primary font-black uppercase tracking-tighter mb-4 pointer-events-auto"><UiKineticText :text="activeHoverOption?.name || ''" /></h3>
            <p class="text-[clamp(12px,1vw,16px)] font-secondary text-white/70 leading-relaxed max-w-[20ch] md:max-w-[26ch] xl:max-w-[30ch] text-balance pointer-events-auto"><UiKineticText :text="activeHoverOption?.description || ''" /></p>
          </div>
        </Transition>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { usePriceDrag } from '~/composables/usePriceDrag'
import type { PriceOption } from '~/types/organic'
import { createProductBuilderOptions } from '~/data/productBuilderOptions'
import PriceCoreDisplay from '~/components/sections/price/PriceCoreDisplay.vue'
import PriceSatellite from '~/components/sections/price/PriceSatellite.vue'

defineOptions({ inheritAttrs: false })

const priceRef = ref<HTMLElement | null>(null)
const { emit, on, off } = useEventBus()

type HintState = 'initial' | 'remove' | 'hidden'
const hintState = ref<HintState>('initial')

const isPriceActive = ref(false)
const isPriceVisible = ref(false)

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()

const options = ref<PriceOption[]>(createProductBuilderOptions(false))

const windowW = ref(1024)
const isMobile = computed(() => windowW.value < 768)

const basePrice = 0
const displayPrice = ref(0)

const totalPrice = computed(() => {
  return options.value.reduce((acc, opt) => opt.selected ? acc + opt.price : acc, basePrice)
})

const updateOrganic = () => {
  const selectedCount = options.value.filter(o => o.selected).length;
  if (selectedCount > 0 && hintState.value === 'initial') {
    hintState.value = 'remove';
  }

  emit('price-update', { 
    active: true, 
    options: options.value.map(o => ({ ...o })), 
    totalPrice: totalPrice.value 
  })
}

const { hoveredOptId, hoverOption, startDrag, registerOptionRef, unselectLast, submitProject } = usePriceDrag(options, isMobile, updateOrganic, emit, hintState)

const activeHoverOption = computed(() => {
  return options.value.find(opt => opt.id === hoveredOptId.value) || null
})

watch(totalPrice, (newVal) => {
  gsap.to(displayPrice, {
    value: newVal,
    duration: 1.5,
    ease: 'power3.out',
    snap: { value: 1 }
  })
})

const resize = () => {
  windowW.value = window.innerWidth;
}

let enterDelay: gsap.core.Tween | null = null
let enterRaf: number | null = null

const handleMenuState = (isOpen: boolean) => {
  if (isOpen) {
    if (enterDelay) enterDelay.kill()
    if (enterRaf !== null) cancelAnimationFrame(enterRaf)
  }
}

const handleSectionChange = (label: string) => {
  if (enterDelay) enterDelay.kill()
  
  if (label === '[ Прайс ]') {
    isPriceActive.value = true
    
    // Сразу запускаем органику, чтобы не было ощущения "замирания" анимации
    updateOrganic()
    
    const bgTargets = priceRef.value?.querySelectorAll('.price-anim-target')
    if (bgTargets && bgTargets.length) {
      gsap.killTweensOf(bgTargets)
      gsap.fromTo(bgTargets, 
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          delay: 1.6,
          ease: 'power3.out',
          clearProps: 'opacity'
        }
      )
    }

    // Тяжёлые элементы (ядро + сателлиты-формы) показываем уже после разложения сферы
    enterDelay = gsap.delayedCall(1.8, () => {
      if (!isPriceActive.value) return;

      const heavyTargets = priceRef.value?.querySelectorAll('.price-heavy-target')
      const coreContainer = heavyTargets?.[0]   // слой ядра + кнопки
      const satContainer = heavyTargets?.[1]    // слой сателлитов
      const satellites = priceRef.value?.querySelectorAll('.price-satellite')
      if (heavyTargets && heavyTargets.length) {
        gsap.killTweensOf(heavyTargets)
        gsap.set(heavyTargets, { opacity: 0 })
      }
      if (satellites && satellites.length) gsap.killTweensOf(satellites)

      isPriceVisible.value = true

      if (enterRaf !== null) cancelAnimationFrame(enterRaf)
      enterRaf = requestAnimationFrame(() => {
        if (isMenuOpenLocal.value) return
        // Ядро (центр сферы) проявляем плавно
        if (coreContainer) gsap.fromTo(coreContainer, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power3.out', clearProps: 'opacity' })
        // Слой-контейнер сателлитов делаем видимым сразу, а сами сателлиты на сфере — по очереди (красивее)
        if (satContainer) gsap.set(satContainer, { clearProps: 'opacity' })
        if (satellites && satellites.length) {
          // Глушим собственный transition-opacity сателлитов на время GSAP (иначе вспышка и смазанный stagger)
          satellites.forEach((el) => { (el as HTMLElement).style.transition = 'none' })
          const activeSatellites = Array.from(satellites).filter((_, idx) => !options.value[idx]?.selected)
          if (activeSatellites.length) {
            gsap.fromTo(activeSatellites,
              { opacity: 0 },
              {
                opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out', clearProps: 'opacity',
                onComplete: () => satellites.forEach((el) => { (el as HTMLElement).style.transition = '' })
              }
            )
          } else {
            satellites.forEach((el) => { (el as HTMLElement).style.transition = '' })
          }
        }
      })
    })
  } else {
    if (isPriceActive.value) {
      isPriceActive.value = false
      emit('price-state', false)
      if (enterDelay) enterDelay.kill()
      
      const bgTargets = priceRef.value?.querySelectorAll('.price-anim-target')
      const heavyTargets = priceRef.value?.querySelectorAll('.price-heavy-target')
      const satellites = priceRef.value?.querySelectorAll('.price-satellite')

      if (bgTargets && bgTargets.length) {
        gsap.killTweensOf(bgTargets)
        gsap.to(bgTargets, { opacity: 0, duration: 0.3, ease: 'power2.out' })
      }
      if (satellites && satellites.length) {
        gsap.killTweensOf(satellites)
        satellites.forEach((el) => { (el as HTMLElement).style.transition = '' })
      }

      if (heavyTargets && heavyTargets.length && isPriceVisible.value) {
        gsap.killTweensOf(heavyTargets)
        gsap.to(heavyTargets, { 
          opacity: 0, 
          duration: 0.3, 
          ease: 'power2.out',
          onComplete: () => {
            isPriceVisible.value = false
            gsap.set(heavyTargets, { clearProps: 'opacity' })
          }
        })
      } else {
        isPriceVisible.value = false
      }
    }
  }
}

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  on('menu-state', handleMenuState)
  on('section-change', handleSectionChange)

  // Сразу прячем элементы анимации при монтировании, чтобы они не мелькали до скролла
  const initialBgTargets = priceRef.value?.querySelectorAll('.price-anim-target')
  if (initialBgTargets && initialBgTargets.length) {
    gsap.set(initialBgTargets, { opacity: 0 })
  }
})

onBeforeUnmount(() => {
  if (enterDelay) enterDelay.kill()
  if (enterRaf !== null) cancelAnimationFrame(enterRaf)
  const targets = priceRef.value?.querySelectorAll('.price-anim-target')
  const heavyTargets = priceRef.value?.querySelectorAll('.price-heavy-target')
  const satellites = priceRef.value?.querySelectorAll('.price-satellite')
  if (targets) gsap.killTweensOf(targets)
  if (heavyTargets) gsap.killTweensOf(heavyTargets)
  if (satellites) gsap.killTweensOf(satellites)
  gsap.killTweensOf(displayPrice)
  window.removeEventListener('resize', resize)
  off('menu-state', handleMenuState)
  off('section-change', handleSectionChange)
})
</script>

<style scoped>
.blur-enter-active,
.blur-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.blur-enter-from,
.blur-leave-to {
  opacity: 0;
  filter: blur(12px);
  transform: translateY(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
