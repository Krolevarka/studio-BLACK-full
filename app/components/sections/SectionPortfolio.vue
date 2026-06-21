<template>
  <DeviceSwitch
    :desktop="DesktopPortfolioContent"
    :mobile="MobilePortfolioContent"
    :id="id"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DesktopPortfolioContent = defineAsyncComponent(() => import('~/components/sections/desktop/PortfolioContent.vue'))
const MobilePortfolioContent = defineAsyncComponent(() => import('~/components/sections/mobile/PortfolioContent.vue'))

defineProps<{ id?: string }>()
</script>
