<template>
  <section ref="aboutRef" v-bind="$attrs" class="reveal-scope-mobile relative h-dvh w-full bg-transparent flex flex-col justify-center items-center">
    <!-- Логотип (Поверх сферы) -->
    <div
class="absolute inset-0 w-full max-w-none mx-auto z-[50] flex flex-col h-full pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      <!-- Верхняя половина для логотипа -->
      <div
class="reveal-item flex items-center justify-center w-full flex-1 logo-container pointer-events-none px-6"
           :class="{ 'is-revealed': revealed }">
        <LogoKvazar class="w-[85%] md:w-[75%]" />
      </div>
      <!-- Пустая нижняя половина -->
      <div class="w-full flex-1"/>
    </div>

    <!-- Текст (Под сферой) -->
    <div
class="absolute inset-0 w-full max-w-none mx-auto z-10 flex flex-col h-full pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      <!-- Пустая верхняя половина -->
      <div class="w-full flex-1"/>

      <!-- Нижняя половина с текстом -->
      <div class="flex flex-col justify-start items-center text-center relative w-full flex-1 px-6 pb-8 pt-16 lg:pt-20">
        <!-- Заголовок-тег -->
        <div class="mb-6">
          <div
class="reveal-item font-secondary text-xs uppercase tracking-[0.2em] text-white/70 pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 150ms">
            [ Full-stack разработка ]
          </div>
        </div>

        <!-- Текстовые блоки -->
        <div class="flex flex-col space-y-6 items-center w-full max-w-sm">
          <div>
            <p
class="reveal-item font-secondary text-sm md:text-base text-white leading-relaxed pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 250ms">
              Мы создаем цифровые продукты под ключ: сайты, веб-приложения, чат-ботов, ИИ-клиентов и мобильные приложения. Берем на себя весь цикл: от идеи, UX и дизайна до frontend, backend, интеграций и запуска в production.
            </p>
          </div>
          <div>
            <p
class="reveal-item font-secondary text-xs md:text-sm text-white/70 leading-relaxed pointer-events-auto"
               :class="{ 'is-revealed': revealed }" style="--reveal-delay: 350ms">
              Работаем как техническая команда для бизнеса: проектируем архитектуру, настраиваем CI/CD, разворачиваем продукт на сервере и остаемся рядом после релиза. Поддерживаем, развиваем и улучшаем проект, когда он уже работает с реальными пользователями.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useEventBus } from '~/composables/useEventBus'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'

defineOptions({ inheritAttrs: false })

const aboutRef = ref<HTMLElement | null>(null)

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()
// Унифицированное появление/исчезновение контента секции
const { revealed } = useSectionReveal('[ О нас ]')

onMounted(() => {
  // Взаимодействие со сферой
  on('section-change', (label: string) => {
    if (label === '[ О нас ]') {
      emit('about-state', true)
    } else {
      emit('about-state', false)
    }
  })
})
</script>
