<template>
  <Teleport to="body">
    <Transition name="legal" @enter="onOpen" @after-leave="onClosed">
      <div
        v-if="activeDoc"
        data-lenis-prevent
        class="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-6"
      >
        <!-- Затемнение -->
        <div class="legal-backdrop absolute inset-0 bg-black/70 backdrop-blur-md" @click="close" />

        <!-- Панель -->
        <div
          ref="panelRef"
          role="dialog"
          aria-modal="true"
          :aria-label="currentTitle"
          class="legal-panel relative w-full md:max-w-3xl bg-[#0a0a0a] border-t md:border border-white/10 md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90dvh] md:max-h-[85vh] flex flex-col overflow-hidden"
        >
          <!-- Шапка: эйрбоу, заголовок, закрытие, вкладки -->
          <header ref="headerRef" class="shrink-0 px-6 md:px-10 pt-6 md:pt-8 pb-4 border-b border-white/5">
            <div class="flex items-start justify-between gap-4 mb-6">
              <div class="min-w-0">
                <span class="block text-[10px] md:text-[11px] font-mono font-bold text-white/40 uppercase tracking-[0.3em] mb-2">
                  Правовая информация // KVAZAR
                </span>
                <h3 class="font-primary text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">
                  {{ currentTitle }}
                </h3>
              </div>
              <button
                aria-label="Закрыть"
                class="shrink-0 -mr-2 -mt-2 text-white/50 hover:text-white text-3xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
                @click="close"
              >
                &times;
              </button>
            </div>

            <div role="tablist" aria-label="Разделы" class="flex flex-wrap gap-x-6 gap-y-2">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                role="tab"
                :aria-selected="activeDoc === tab.id"
                class="relative pb-2 font-secondary text-[11px] md:text-xs uppercase tracking-[0.2em] transition-colors min-h-[44px] flex items-end"
                :class="activeDoc === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'"
                @click="open(tab.id)"
              >
                {{ tab.label }}
                <span
                  class="absolute bottom-0 left-0 h-[1px] bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  :class="activeDoc === tab.id ? 'w-full opacity-100' : 'w-0 opacity-0'"
                />
              </button>
            </div>
          </header>

          <!-- Тело: клиппирующий viewport с анимируемой высотой -->
          <div
            ref="viewportRef"
            class="legal-viewport relative"
            :class="useDrag ? 'overflow-hidden drag-lock' : 'overflow-y-auto'"
            :style="{ height: viewportHeight }"
            @touchstart.passive="onTouchStart"
            @touchmove.passive="onTouchMove"
            @touchend.passive="onTouchEnd"
          >
            <!-- Трек: физически двигается на мобильных, обычный поток на десктопе -->
            <div ref="trackRef" class="px-6 md:px-10 py-7 md:py-8" :class="useDrag ? 'will-change-transform' : ''">
              <Transition name="legal-swap" mode="out-in" @enter="onContentEnter">
                <div :key="activeDoc" class="max-w-none">

                  <!-- Политика / Cookie: разделы -->
                  <div v-if="activeDoc === 'privacy' || activeDoc === 'cookie'" class="space-y-8">
                    <section v-for="section in currentSections" :key="section.id">
                      <h4 class="font-primary text-base md:text-lg font-bold uppercase tracking-tight text-white mb-3 leading-snug">
                        {{ section.title }}
                      </h4>
                      <div v-if="section.paragraphs" class="space-y-3">
                        <p
                          v-for="(p, i) in section.paragraphs"
                          :key="i"
                          class="font-secondary text-[13px] md:text-sm text-white/65 leading-relaxed"
                        >
                          {{ p }}
                        </p>
                      </div>
                      <ul v-if="section.list" class="mt-3 space-y-2">
                        <li
                          v-for="(item, i) in section.list"
                          :key="i"
                          class="relative pl-5 font-secondary text-[13px] md:text-sm text-white/65 leading-relaxed before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-white/30"
                        >
                          {{ item }}
                        </li>
                      </ul>
                    </section>

                    <!-- Управление cookie (только во вкладке Cookie) -->
                    <div v-if="activeDoc === 'cookie'" class="pt-2">
                      <div class="flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          class="flex-1 rounded-full bg-white text-black font-secondary text-[11px] tracking-[0.15em] uppercase font-bold py-3 min-h-[44px] transition-shadow hover:shadow-[0_0_24px_rgba(255,255,255,0.3)]"
                          :class="choice === 'accepted' ? 'ring-2 ring-white/60' : ''"
                          @click="accept"
                        >
                          Принять все
                        </button>
                        <button
                          type="button"
                          class="flex-1 rounded-full border border-white/15 bg-transparent text-white font-secondary text-[11px] tracking-[0.15em] uppercase font-bold py-3 min-h-[44px] transition-colors hover:border-white/40"
                          :class="choice === 'necessary' ? 'border-white/60' : ''"
                          @click="acceptNecessary"
                        >
                          Только необходимые
                        </button>
                      </div>
                      <p v-if="choice" class="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                        Текущий выбор: {{ choice === 'accepted' ? 'приняты все cookie' : 'только необходимые' }}
                      </p>
                    </div>
                  </div>

                  <!-- Реквизиты: определения -->
                  <div v-else-if="activeDoc === 'requisites'">
                    <dl class="divide-y divide-white/5">
                      <div
                        v-for="item in requisites"
                        :key="item.label"
                        class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-4"
                      >
                        <dt class="shrink-0 sm:w-64 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/40">
                          {{ item.label }}
                        </dt>
                        <dd
                          class="font-secondary text-sm md:text-base leading-relaxed"
                          :class="item.isPlaceholder ? 'text-white/35 italic' : 'text-white'"
                        >
                          {{ item.value }}
                        </dd>
                      </div>
                    </dl>
                    <p class="mt-6 font-secondary text-[12px] text-white/45 leading-relaxed">
                      Реквизиты будут дополнены официальными данными оператора. По любым правовым вопросам
                      пишите на {{ OPERATOR_EMAIL }}.
                    </p>
                  </div>

                </div>
              </Transition>
            </div>

            <!-- Подсказка прокрутки (только на мобильных, когда контент не влезает) -->
            <div
              v-if="useDrag"
              class="pointer-events-none absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent transition-opacity duration-300"
              :class="isScrollable ? 'opacity-100' : 'opacity-0'"
            />
          </div>

          <!-- Подвал: подпись и дата редакции -->
          <footer ref="footerRef" class="shrink-0 px-6 md:px-10 py-4 border-t border-white/5 flex items-center justify-between gap-4 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
            <span>KVAZAR WEB STUDIO</span>
            <span>Ред. {{ LEGAL_UPDATED_AT }}</span>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useLegalModal } from '~/composables/useLegalModal'
import { useCookieConsent } from '~/composables/useCookieConsent'
import { useDeviceSwitch } from '~/composables/useDeviceSwitch'
import { useDragScroll } from '~/composables/useDragScroll'
import { privacyPolicy } from '~/data/legal/privacyPolicy'
import { cookieInfo } from '~/data/legal/cookieInfo'
import { requisites, OPERATOR_EMAIL } from '~/data/legal/requisites'
import { LEGAL_UPDATED_AT } from '~/data/legal/meta'
import type { LegalDocId } from '~/types/legal'

const { activeDoc, open, close, initFromUrl } = useLegalModal()
const { choice, hydrate, accept, acceptNecessary } = useCookieConsent()
const { isMobileOrTablet } = useDeviceSwitch()

// Кастомный драг-скролл только на тач-устройствах; десктоп — нативный overflow
const useDrag = isMobileOrTablet.value

const panelRef = ref<HTMLElement | null>(null)
const headerRef = ref<HTMLElement | null>(null)
const footerRef = ref<HTMLElement | null>(null)
const viewportRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

const viewportHeight = ref<string>('')
const isScrollable = ref(false)

const drag = useDragScroll({ viewport: viewportRef, track: trackRef })

const tabs: Array<{ id: LegalDocId; label: string }> = [
  { id: 'privacy', label: privacyPolicy.tab },
  { id: 'requisites', label: 'Реквизиты' },
  { id: 'cookie', label: cookieInfo.tab }
]

const titles: Record<LegalDocId, string> = {
  privacy: privacyPolicy.title,
  requisites: 'Реквизиты',
  cookie: cookieInfo.title
}

const currentTitle = computed(() => (activeDoc.value ? titles[activeDoc.value] : ''))
const currentSections = computed(() => {
  if (activeDoc.value === 'privacy') return privacyPolicy.sections
  if (activeDoc.value === 'cookie') return cookieInfo.sections
  return []
})

// Тач-обработчики активны только на мобильных
const onTouchStart = (e: TouchEvent) => { if (useDrag) drag.onTouchStart(e) }
const onTouchMove = (e: TouchEvent) => { if (useDrag) drag.onTouchMove(e) }
const onTouchEnd = () => { if (useDrag) drag.onTouchEnd() }

// Измеряем контент и задаём анимируемую высоту тела модалки
const measure = () => {
  if (!import.meta.client || !trackRef.value || !viewportRef.value) return
  const headerH = headerRef.value?.offsetHeight ?? 0
  const footerH = footerRef.value?.offsetHeight ?? 0
  const panelMax = window.innerHeight * (useDrag ? 0.9 : 0.85)
  const maxBody = Math.max(140, panelMax - headerH - footerH)
  const content = trackRef.value.scrollHeight
  const target = Math.min(content, maxBody)
  viewportHeight.value = `${Math.round(target)}px`
  isScrollable.value = content > target + 1
  nextTick(() => drag.recalc())
}

// Открытие модалки: первый замер (высота ставится сразу, без анимации auto→px)
const onOpen = () => {
  nextTick(() => {
    drag.reset()
    measure()
  })
}

// Смена вкладки: сбрасываем прокрутку вверх и плавно морфим высоту
const onContentEnter = () => {
  if (useDrag) drag.reset()
  else if (viewportRef.value) viewportRef.value.scrollTop = 0
  measure()
}

const onClosed = () => {
  viewportHeight.value = ''
  isScrollable.value = false
}

// Пересчёт при повороте экрана / ресайзе
const onResize = () => {
  if (activeDoc.value) measure()
}

// Закрытие по Esc — слушатель живёт только пока модалка открыта
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
}

watch(activeDoc, (doc) => {
  if (!import.meta.client) return
  if (doc) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onMounted(() => {
  hydrate()
  initFromUrl()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('resize', onResize)
  }
  drag.destroy()
})
</script>

<style scoped>
/* Плавная анимация высоты тела при смене вкладок */
.legal-viewport {
  transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.drag-lock {
  touch-action: none;
}

/* Появление/скрытие оверлея: затемнение и панель анимируются раздельно */
.legal-enter-active .legal-backdrop,
.legal-leave-active .legal-backdrop {
  transition: opacity 0.4s ease;
}
.legal-enter-from .legal-backdrop,
.legal-leave-to .legal-backdrop {
  opacity: 0;
}

.legal-enter-active .legal-panel {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.legal-leave-active .legal-panel {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.legal-enter-from .legal-panel,
.legal-leave-to .legal-panel {
  opacity: 0;
  transform: translateY(28px) scale(0.985);
}

/* Смена содержимого вкладок */
.legal-swap-enter-active {
  transition: opacity 0.35s ease-out, transform 0.35s ease-out;
}
.legal-swap-leave-active {
  transition: opacity 0.2s ease-in, transform 0.2s ease-in;
}
.legal-swap-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.legal-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
