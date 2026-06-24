<script setup lang="ts">
import { useCursor } from '~/composables/useCursor'
import { useDevice } from '#imports'

const { coreRef, trailRef, ringRef, isHidden, isPreloading } = useCursor()
const { isSafari, isIos } = useDevice()
const disableHeavyFilters = isSafari || isIos
</script>

<template>
  <!-- Невидимый SVG для фильтра Gooey -->
    <svg style="width: 0; height: 0; position: absolute; pointer-events: none;">
      <defs>
        <filter id="cursor-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
        </filter>
      </defs>
    </svg>

    <div class="custom-cursor-wrapper" :class="{ 'is-hidden': isHidden || isPreloading }">
      <div class="cursor-gooey-container" :class="disableHeavyFilters ? 'no-filter' : ''">
        <!-- Ведомая капля (Trail) -->
        <div ref="trailRef" class="cursor-blob cursor-trail"></div>
        <!-- Главная капля (Core) -->
        <div ref="coreRef" class="cursor-blob cursor-core"></div>
      </div>
      <!-- Отдельный контур для ссылок (без gooey фильтра) -->
      <div ref="ringRef" class="cursor-ring"></div>
    </div>
</template>

<style>
body.custom-cursor-enabled,
body.custom-cursor-enabled * {
  cursor: none !important;
}
</style>

<style scoped>
.custom-cursor-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  pointer-events: none;
  z-index: 999999;
  transition: opacity 0.3s ease;
  mix-blend-mode: difference;
}

.custom-cursor-wrapper.is-hidden {
  opacity: 0;
}

.cursor-gooey-container {
  width: 100%;
  height: 100%;
  filter: url(#cursor-goo);
  position: absolute;
  top: 0;
  left: 0;
}

.cursor-gooey-container.no-filter {
  filter: none;
}

.cursor-blob {
  position: absolute;
  top: 0;
  left: 0;
  background-color: white;
  border-radius: 50%;
  transform-origin: center center;
  pointer-events: none;
}

/* При отключенном фильтре Gooey на Safari форсируем сильное скругление, 
   чтобы квадратные магнитные кнопки обволакивались "таблеткой", а не острым квадратом */
.no-filter .cursor-blob {
  border-radius: 999px !important;
}

/* Без фильтра Gooey ведомая капля (trail) выглядит как отдельный оторванный круг.
   Скрываем ее на Safari, чтобы избежать визуальной каши и инверсии друг друга. */
.no-filter .cursor-trail {
  display: none !important;
}

.cursor-ring {
  position: absolute;
  top: 0;
  left: 0;
  border: 1.5px solid white;
  border-radius: 50%;
  transform-origin: center center;
  pointer-events: none;
  z-index: 3;
}

.cursor-core {
  z-index: 2;
}

.cursor-trail {
  z-index: 1;
}
</style>
