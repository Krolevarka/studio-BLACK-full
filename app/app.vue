<template>
  <div class="app-container bg-[#050505]">
    <Preloader />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

useHead({
  htmlAttrs: { lang: 'ru' },
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - KVAZAR` : 'KVAZAR - Цифровые пространства для брендов';
  },
  meta: [
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: 'KVAZAR - Цифровые пространства для брендов' },
    { property: 'og:description', content: 'Органический код. Плавный дизайн. Веб-студия нового поколения.' },
    { property: 'og:image', content: '/og-image.jpg' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ],
  link: [
    { rel: 'canonical', href: 'https://kvazar.studio' }
  ]
})

const preventTab = (e: KeyboardEvent): void => {
  if (e.key === 'Tab') {
    e.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('keydown', preventTab)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', preventTab)
})
</script>

<style>
/* 
 * ВАЖНО: Эти стили намеренно оставлены глобальными (без атрибута scoped).
 * Nuxt pageTransition требует глобальных классов для корректной работы анимаций переходов между страницами.
 */
/* Плавные переходы между страницами */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.5s ease, filter 0.5s ease;
  transform: translateZ(0);
  will-change: opacity, filter;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(10px);
}

/* Отключаем тяжелый фильтр для Safari на iOS, так как он убивает FPS */
@supports (-webkit-touch-callout: none) {
  .page-enter-active,
  .page-leave-active {
    transition: opacity 0.5s ease;
    will-change: opacity;
  }
  .page-enter-from,
  .page-leave-to {
    opacity: 0;
    filter: none;
  }
}
</style>
