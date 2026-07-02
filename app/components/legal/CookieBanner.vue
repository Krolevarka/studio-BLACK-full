<template>
  <Teleport to="body">
    <Transition name="cookie">
      <div
        v-if="visible"
        class="fixed z-[95] inset-x-0 bottom-0 md:inset-x-auto md:left-6 md:bottom-6 md:max-w-sm"
        style="padding-bottom: env(safe-area-inset-bottom, 0px);"
      >
        <div class="m-3 md:m-0 rounded-2xl border border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl p-5 shadow-2xl">
          <p class="font-secondary text-[12.5px] text-white/65 leading-relaxed mb-4">
            {{ COOKIE_BANNER_TEXT }}
            Подробнее — в
            <button
              type="button"
              class="text-white underline underline-offset-2 decoration-white/40 hover:decoration-white transition-colors"
              @click="openPrivacy"
            >
              Политике конфиденциальности</button>.
          </p>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 rounded-full bg-white text-black font-secondary text-[11px] tracking-[0.15em] uppercase font-bold py-2.5 min-h-[44px] transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95"
              @click="accept"
            >
              Принять
            </button>
            <button
              type="button"
              class="flex-1 rounded-full border border-white/15 bg-transparent text-white/80 font-secondary text-[11px] tracking-[0.15em] uppercase font-bold py-2.5 min-h-[44px] transition-colors hover:border-white/40 hover:text-white active:scale-95"
              @click="acceptNecessary"
            >
              Только необходимые
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useCookieConsent } from '~/composables/useCookieConsent'
import { useLegalModal } from '~/composables/useLegalModal'
import { useOrganicCore } from '~/composables/useOrganicCore'
import { COOKIE_BANNER_TEXT } from '~/data/legal/cookieInfo'

const { choice, hydrated, hydrate, accept, acceptNecessary } = useCookieConsent()
const { open } = useLegalModal()
const { isPreloading } = useOrganicCore()

// Небольшая задержка после прелоадера, чтобы баннер не спорил со стартовой анимацией
const delayPassed = ref(false)
let delayTimer: ReturnType<typeof setTimeout> | null = null

const visible = computed(() =>
  hydrated.value && choice.value === null && !isPreloading.value && delayPassed.value
)

const openPrivacy = () => open('privacy')

onMounted(() => {
  hydrate()
  delayTimer = setTimeout(() => {
    delayPassed.value = true
  }, 1200)
})

onBeforeUnmount(() => {
  if (delayTimer) clearTimeout(delayTimer)
})
</script>

<style scoped>
.cookie-enter-active {
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.cookie-leave-active {
  transition: opacity 0.4s ease-in, transform 0.4s ease-in;
}
.cookie-enter-from,
.cookie-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style>
