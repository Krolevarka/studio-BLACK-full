<template>
  <DeviceSwitch
    :desktop="DesktopAboutContent"
    :mobile="MobileAboutContent"
    :id="id"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DesktopAboutContent = defineAsyncComponent(() => import('~/components/sections/desktop/AboutContent.vue'))
const MobileAboutContent = defineAsyncComponent(() => import('~/components/sections/mobile/AboutContent.vue'))

defineProps<{ id?: string }>()
</script>
