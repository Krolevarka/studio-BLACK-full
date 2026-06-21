<template>
  <component :is="tag" class="kinetic-text inline-block" @mouseover="onMouseOver">
    <span v-once>
      <span 
        v-for="(word, wIndex) in words" 
        :key="wIndex" 
        class="inline-block whitespace-nowrap"
      >
        <span 
          v-for="(char, cIndex) in word" 
          :key="cIndex" 
          class="kinetic-char inline-block relative"
        >
          {{ char }}
        </span>
        <span class="inline-block" v-if="wIndex < words.length - 1">&nbsp;</span>
      </span>
    </span>
  </component>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import gsap from 'gsap'
import { useMouseVelocity } from '~/composables/useMouseVelocity'

interface Props {
  text: string
  tag?: string
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'span'
})

// Разбиваем текст на слова и буквы, чтобы сохранить корректные переносы строк
const words = computed(() => props.text.split(' ').map(word => word.split('')))

const { startListening, stopListening, getVelocity } = useMouseVelocity()

onMounted(() => {
  startListening()
})

onBeforeUnmount(() => {
  stopListening()
})

function onMouseOver(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.classList.contains('kinetic-char')) return

  const { vx, vy, speed } = getVelocity()
  
  // Если мышь движется очень медленно, эффект минимален
  if (speed < 0.5) return
  
  // Ограничиваем максимальную деформацию
  const maxSpread = 12
  const maxSpeed = 50
  const clampedSpeed = Math.min(speed, maxSpeed)
  
  const spreadX = (vx / maxSpeed) * maxSpread
  const spreadY = (vy / maxSpeed) * maxSpread
  
  gsap.fromTo(target, 
    {
      willChange: 'transform, text-shadow',
      x: spreadX * 0.4,
      y: spreadY * 0.4,
      textShadow: `
        ${spreadX * 0.4}px ${spreadY * 0.4}px 2px rgba(255,255,255,0.7),
        ${spreadX * 0.8}px ${spreadY * 0.8}px 5px rgba(255,255,255,0.4),
        ${spreadX * 1.2}px ${spreadY * 1.2}px 8px rgba(255,255,255,0.1)
      `
    },
    {
      x: 0,
      y: 0,
      textShadow: '0px 0px 0px rgba(255,255,255,0), 0px 0px 0px rgba(255,255,255,0), 0px 0px 0px rgba(255,255,255,0)',
      duration: 1.2,
      ease: 'elastic.out(1, 0.4)',
      overwrite: 'auto',
      onComplete: () => {
        gsap.set(target, { clearProps: 'willChange' })
      }
    }
  )
}
</script>

<style scoped>
.kinetic-char {
  transform-origin: center center;
}
</style>
