<template>
  <DeviceSwitch
    :desktop="DesktopModal"
    :mobile="MobileModal"
    :is-open="isOpen"
    @close="$emit('close')"
  />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()

const DesktopModal = defineAsyncComponent(() => import('~/components/sections/desktop/PriceDevModeModal.vue'))
const MobileModal = defineAsyncComponent(() => import('~/components/sections/mobile/PriceDevModeModal.vue'))
</script>
