<template>
  <DeviceSwitch
    :id="id"
    :desktop="DesktopPriceContent"
    :mobile="MobilePriceContent"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DesktopPriceContent = defineAsyncComponent(() => import('~/components/sections/desktop/PriceContent.vue'))
const MobilePriceContent = defineAsyncComponent(() => import('~/components/sections/mobile/PriceContent.vue'))

defineProps<{ id?: string }>()
</script>
