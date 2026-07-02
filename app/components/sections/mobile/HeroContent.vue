<template>
  <section v-bind="$attrs" class="reveal-scope-mobile snap-section relative h-dvh w-full overflow-hidden bg-transparent flex flex-col justify-center items-center">
    
    <!-- Текстовый контент -->
    <div
class="w-full max-w-7xl mx-auto z-10 relative flex flex-col items-center justify-center text-center px-6 mix-blend-difference transform-gpu pointer-events-none" 
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      
      <!-- Брутальный заголовок (уменьшенный для мобильных) -->
      <div role="heading" aria-level="1" class="font-primary text-4xl md:text-5xl font-bold tracking-tighter text-white leading-[0.9] mb-6 flex flex-col">
        <div class="overflow-hidden pointer-events-auto">
          <div class="reveal-item block" :class="{ 'is-revealed': revealed }">
            СИЛЬНЫЕ
          </div>
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <div class="reveal-item block" :class="{ 'is-revealed': revealed }" style="--reveal-delay: 80ms">
            ЦИФРОВЫЕ
          </div>
        </div>
        <div class="overflow-hidden pointer-events-auto">
          <div class="reveal-item block" :class="{ 'is-revealed': revealed }" style="--reveal-delay: 160ms">
            РЕШЕНИЯ
          </div>
        </div>
      </div>

      <p
class="reveal-item font-secondary text-xs md:text-sm uppercase tracking-[0.2em] text-white/80 max-w-xs md:max-w-md mb-10 pointer-events-auto"
         :class="{ 'is-revealed': revealed }" style="--reveal-delay: 240ms">
        Проектирование и разработка IT-решений под ключ.
      </p>

      <div
class="reveal-item pointer-events-auto"
           :class="{ 'is-revealed': revealed }" style="--reveal-delay: 320ms">
        <UiButton class="font-secondary !bg-transparent !text-white !border !border-white/30 active:!bg-white/10 transition-colors duration-200 min-h-[2.75rem] min-w-[2.75rem] px-6 py-3 flex items-center justify-center touch-manipulation" to="#contact">
          Обсудить проект
        </UiButton>
      </div>

    </div>

    <!-- Подсказка скролла (меню-затухание на обёртке, унифицированный reveal — на внутреннем элементе) -->
    <div
class="absolute bottom-8 left-1/2 -translate-x-1/2 mix-blend-difference transform-gpu z-20 pointer-events-none"
         :class="[
           isMenuTransitioning ? 'transition-opacity' : '',
           isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
         ]">
      <div class="reveal-item" :class="{ 'is-revealed': revealed && !hasScrolled }" style="--reveal-delay: 420ms">
        <UiScrollHint />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'

defineOptions({ inheritAttrs: false })

const hasScrolled = ref(false)

const handleScroll = () => {
  if (window.scrollY > 20) {
    hasScrolled.value = true
    window.removeEventListener('scroll', handleScroll)
  }
}

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
// Унифицированное появление контента (первый показ гейтится прелоадером через arrivedLabel в index.vue)
const { revealed } = useSectionReveal('[ Студия ]')

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.touch-manipulation {
  touch-action: none;
}
</style>
