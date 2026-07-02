<template>
  <!-- Оверлей «поверните устройство». Чисто CSS: показывается только на телефонах
       в альбомной ориентации (orientation:landscape + короткая высота + coarse-pointer).
       Планшеты не затрагивает — у них высота в landscape > 500px. JS/device-detection
       не используется намеренно (нет риска hydration-mismatch). -->
  <div class="rotate-notice" aria-hidden="true">
    <div class="rotate-notice__inner">
      <svg
class="rotate-notice__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 19h2" />
      </svg>
      <p class="rotate-notice__title font-primary">Поверните устройство</p>
      <p class="rotate-notice__sub font-secondary">Сайт оптимизирован для вертикального просмотра</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Логики нет: видимость полностью управляется media-query ниже.
</script>

<style scoped>
.rotate-notice {
  display: none;
}

/* Только телефоны в альбомной ориентации. max-height:500px отсекает планшеты. */
@media (orientation: landscape) and (max-height: 500px) and (pointer: coarse) {
  .rotate-notice {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #050505;
    pointer-events: auto;
    padding: 1.5rem;
    text-align: center;
  }
}

.rotate-notice__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: 22rem;
}

.rotate-notice__icon {
  width: 2.75rem;
  height: 2.75rem;
  color: #ffffff;
  transform-origin: center;
  animation: rotate-hint 2.4s ease-in-out infinite;
}

.rotate-notice__title {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-size: 1.25rem;
  line-height: 1.1;
  color: #ffffff;
}

.rotate-notice__sub {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.6);
}

/* Подсказка-«поворот»: лёгкое покачивание телефона к вертикали */
@keyframes rotate-hint {
  0%, 100% { transform: rotate(90deg); }
  35%, 65% { transform: rotate(0deg); }
}

@media (prefers-reduced-motion: reduce) {
  .rotate-notice__icon {
    animation: none;
    transform: rotate(0deg);
  }
}
</style>
