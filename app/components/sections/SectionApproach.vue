<template>
  <DeviceSwitch
    :desktop="DesktopApproachContent"
    :mobile="MobileApproachContent"
    :id="id"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DesktopApproachContent = defineAsyncComponent(() => import('~/components/sections/desktop/ApproachContent.vue'))
const MobileApproachContent = defineAsyncComponent(() => import('~/components/sections/mobile/ApproachContent.vue'))

defineProps<{ id?: string }>()
</script>
