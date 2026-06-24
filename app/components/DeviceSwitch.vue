<template>
  <component :is="activeComponent" v-bind="filteredProps" v-bind:="$attrs" />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useDeviceSwitch } from '~/composables/useDeviceSwitch'

const props = defineProps<{
  desktop: Component
  mobile: Component
  tablet?: Component
  isPreloading?: boolean
  isMenuOpen?: boolean
  isMenuAnimating?: boolean
  currentMenuLabel?: string
  isContactTyping?: boolean
  isTechStackOpen?: boolean
}>()

const { deviceType } = useDeviceSwitch()

const activeComponent = computed<Component>(() => {
  switch (deviceType.value) {
    case 'tablet':
      return props.tablet ?? props.mobile
    case 'mobile':
      return props.mobile
    default:
      return props.desktop
  }
})

const filteredProps = computed(() => {
  const { desktop, mobile, tablet, ...rest } = props
  return rest
})
</script>
