<template>
  <div class="app-container">
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
</script>

<style>
:focus {
  outline: none;
}
:focus-visible {
  outline: 2px solid white;
  outline-offset: 4px;
}

/*
 * ============================================================
 * УНИФИЦИРОВАННОЕ ПОЯВЛЕНИЕ/ИСЧЕЗНОВЕНИЕ КОНТЕНТА СЕКЦИЙ
 * ------------------------------------------------------------
 * Единая система перехода между вкладками. Все тайминги, easing
 * и сдвиг управляются ОТСЮДА через CSS-переменные.
 *
 *  - .reveal-item            — базовый класс анимируемого элемента
 *  - .reveal-item.is-revealed — раскрытое состояние (управляется useSectionReveal)
 *  - --reveal-delay          — задержка для каскада («лесенка»), задаётся инлайн
 *  - --reveal-shift          — сдвиг по Y (можно переопределить инлайн, в т.ч. отрицательный)
 *
 * Анимируем ТОЛЬКО opacity и transform (GPU-friendly), без layout-свойств.
 * ============================================================
 */
:root {
  /* Раздельные кривые: мягкое появление и мягкое исчезновение, без «выстрела» в начале */
  --reveal-ease-in: cubic-bezier(0.25, 1, 0.5, 1);    /* Максимально плавный, благородный выход */
  --reveal-ease-out: cubic-bezier(0.65, 0, 0.35, 1);  /* easeInOutCubic — мягкое растворение без рывка */
  --reveal-dur-in: 1300ms;  /* появление (десктоп) — очень плавное и долгое */
  --reveal-dur-out: 750ms;  /* исчезновение — спокойное, без дёрганья */
  --reveal-shift: 20px;     /* плавный выезд по вертикали */
}

/* Мобильная область: максимальная плавность и чистота без пересечения элементов при скролле */
.reveal-scope-mobile {
  --reveal-ease-in: cubic-bezier(0.25, 1, 0.5, 1);  /* Максимально плавный, благородный выход */
  --reveal-ease-out: cubic-bezier(0.65, 0, 0.35, 1); /* Быстрое и чистое растворение уходящей вкладки */
  --reveal-dur-in: 900ms;                           /* Плавное появление после завершения скролла */
  --reveal-dur-out: 350ms;                          /* Мгновенное исчезновение перед скроллом (без наложения) */
  --reveal-shift: 16px;                             /* Элегантный выезд снизу вверх из пустоты */
}

.reveal-item {
  opacity: 0;
  transform: translate3d(0, var(--reveal-shift, 16px), 0);
  /* ИСЧЕЗНОВЕНИЕ: одинаковое для всех элементов (без каскада), мягкое */
  transition:
    opacity var(--reveal-dur-out) var(--reveal-ease-out) var(--reveal-out-delay, 0ms),
    transform var(--reveal-dur-out) var(--reveal-ease-out) var(--reveal-out-delay, 0ms);
}

.reveal-item.is-revealed {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  /* ПОЯВЛЕНИЕ: с каскадом через --reveal-delay */
  transition:
    opacity var(--reveal-dur-in) var(--reveal-ease-in) var(--reveal-delay, 0ms),
    transform var(--reveal-dur-in) var(--reveal-ease-in) var(--reveal-delay, 0ms);
}

/* Доступность: при prefers-reduced-motion убираем движение, оставляем мгновенную смену видимости */
@media (prefers-reduced-motion: reduce) {
  .reveal-item,
  .reveal-item.is-revealed {
    transition-duration: 1ms;
    transform: none;
  }
}

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
