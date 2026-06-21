<template>
  <section ref="aboutRef" v-bind="$attrs" class="relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Контейнер: вертикальное расположение для мобильных (flex-col) -->
    <div class="w-full max-w-none mx-auto z-10 relative flex flex-col h-full pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      
      <!-- Верхняя половина для логотипа -->
      <div class="flex items-center justify-center w-full flex-1 logo-container transition-all duration-1000 ease-out pointer-events-none px-6 pt-12"
           :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
        <LogoKvazar class="w-[85%] md:w-[75%]" />
      </div>

      <!-- Нижняя половина с текстом -->
      <div class="flex flex-col justify-start items-center text-center relative z-20 w-full flex-1 px-6 pb-8 pt-16 lg:pt-20">
        <!-- Заголовок-тег -->
        <div class="mb-6 overflow-hidden">
          <div class="transition-all duration-700 delay-300 ease-out font-secondary text-xs uppercase tracking-[0.2em] text-white/70 pointer-events-auto"
               :class="isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'">
            [ Цифровые пространства ]
          </div>
        </div>
        
        <!-- Текстовые блоки -->
        <div class="flex flex-col space-y-6 items-center w-full max-w-sm">
          <div class="overflow-hidden">
            <p class="transition-all duration-700 delay-500 ease-out font-secondary text-sm md:text-base text-white leading-relaxed pointer-events-auto"
               :class="isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'">
              Мы не просто пишем код и рисуем дизайн. Мы создаем цифровые экосистемы, в которых бренд оживает. Каждый наш проект — это живой организм, способный адаптироваться, дышать и взаимодействовать с пользователем на глубоком уровне.
            </p>
          </div>
          <div class="overflow-hidden">
            <p class="transition-all duration-700 delay-700 ease-out font-secondary text-xs md:text-sm text-white/70 leading-relaxed pointer-events-auto"
               :class="isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'">
              Отказываясь от шаблонных решений, мы используем генеративный дизайн, плавные анимации и нестандартную архитектуру. Наша цель — погрузить пользователя в состояние потока с первых секунд.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'

defineOptions({ inheritAttrs: false })

const aboutRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()

let observer: IntersectionObserver | null = null

onMounted(() => {
  // Используем IntersectionObserver вместо ScrollTrigger для мобильных
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        isVisible.value = true
        // Не отписываемся сразу, если хотим, чтобы анимация повторялась, 
        // но обычно для мобилок лучше 1 раз, или toggleActions: 'play none none reverse'
        // Оставим только появление.
        observer?.unobserve(entry.target)
      }
    })
  }, { threshold: 0.2 })

  if (aboutRef.value) {
    observer.observe(aboutRef.value)
  }

  // Взаимодействие со сферой
  on('section-change', (label: string) => {
    if (label === '[ О нас ]') {
      emit('about-state', true)
    } else {
      emit('about-state', false)
    }
  })
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
