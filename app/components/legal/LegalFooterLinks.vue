<template>
  <div
    class="flex flex-wrap items-center gap-x-4 gap-y-1 font-secondary text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-white/30"
    :class="align === 'center' ? 'justify-center' : 'justify-start'"
  >
    <span class="whitespace-nowrap">© {{ year }} KVAZAR</span>
    <button
      v-for="link in links"
      :key="link.id"
      type="button"
      class="whitespace-nowrap hover:text-white/70 transition-colors min-h-[36px] flex items-center"
      @click="open(link.id)"
    >
      {{ link.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLegalModal } from '~/composables/useLegalModal'
import type { LegalDocId } from '~/types/legal'

withDefaults(defineProps<{
  align?: 'start' | 'center'
}>(), {
  align: 'start'
})

const { open } = useLegalModal()

const year = new Date().getFullYear()

const links: Array<{ id: LegalDocId; label: string }> = [
  { id: 'privacy', label: 'Политика' },
  { id: 'requisites', label: 'Реквизиты' },
  { id: 'cookie', label: 'Cookie' }
]
</script>
