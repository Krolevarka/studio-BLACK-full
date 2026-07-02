<template>
  <DeviceSwitch
    :id="id"
    :desktop="DesktopContactContent"
    :mobile="MobileContactContent"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DesktopContactContent = defineAsyncComponent(() => import('~/components/sections/desktop/ContactContent.vue'))
const MobileContactContent = defineAsyncComponent(() => import('~/components/sections/mobile/ContactContent.vue'))

defineProps<{ id?: string }>()
</script>
