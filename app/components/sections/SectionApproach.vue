<template>
  <DeviceSwitch
    :id="id"
    :desktop="DesktopApproachContent"
    :mobile="MobileApproachContent"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const DesktopApproachContent = defineAsyncComponent(() => import('~/components/sections/desktop/ApproachContent.vue'))
const MobileApproachContent = defineAsyncComponent(() => import('~/components/sections/mobile/ApproachContent.vue'))

defineProps<{ id?: string }>()
</script>
