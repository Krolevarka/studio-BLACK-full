<template>
  <h1 class="sr-only">Studio Black</h1>
  <DeviceSwitch
    :id="id"
    :desktop="DesktopHeroContent"
    :mobile="MobileHeroContent"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DesktopHeroContent = defineAsyncComponent(() => import('~/components/sections/desktop/HeroContent.vue'))
const MobileHeroContent = defineAsyncComponent(() => import('~/components/sections/mobile/HeroContent.vue'))

defineProps<{ id?: string }>()
</script>

