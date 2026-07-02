<template>
  <section
ref="contactRef" v-bind="$attrs" class="reveal-scope-mobile fixed inset-0 w-full h-dvh flex flex-col overflow-hidden bg-[#050505] z-10"
           :class="[
             isMenuTransitioning ? 'transition-opacity' : '',
             isMenuOpenLocal ? '!opacity-0 duration-[500ms] delay-[100ms]' : (isMenuTransitioning ? 'duration-[500ms] delay-[200ms]' : '')
           ]">

    <div
class="reveal-item relative w-full h-full px-6 pt-[2rem] flex flex-col"
         :class="{ 'is-revealed': revealed }"
         :style="{ paddingBottom: `calc(2rem + ${keyboardOffset}px)` }">
         
      <!-- Top Section: Header & Progress (Fixed) -->
      <div
class="w-full shrink-0 collapsible transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" 
           :class="isTyping ? 'is-closed mb-0' : 'is-open mb-6'">
        <div class="collapsible-inner flex flex-col w-full">
          <!-- Этот блок заменяет верхний padding и плавно сжимается вместе с заголовком -->
          <div class="w-full h-[4.5rem] shrink-0"/>
          
          <div class="flex justify-between items-end mb-4" :class="step <= steps.length ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'">
            <h2 class="font-primary text-3xl font-black uppercase tracking-tight leading-none text-white relative">
              <Transition name="title-fade" mode="out-in">
                <span :key="step === 1 ? 'svyaz' : 'detali'" class="block">{{ step === 1 ? 'СВЯЗЬ' : 'ДЕТАЛИ' }}</span>
              </Transition>
            </h2>
            <!-- Прогресс -->
            <div class="text-[0.625rem] font-secondary tracking-widest text-white/50 uppercase flex items-center gap-2 pb-1">
              <span>{{ step <= steps.length ? `${step} / ${steps.length}` : '' }}</span>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div v-if="step <= steps.length" class="w-full h-[0.125rem] bg-white/10 overflow-hidden relative rounded-full">
            <div class="absolute top-0 left-0 h-full bg-white transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]" :style="{ width: `${(step / steps.length) * 100}%` }"/>
          </div>
        </div>
      </div>

      <!-- Center Section: Brief Content (Flexible & Scrollable) -->
      <div class="w-full flex-1 relative overflow-hidden mb-4">
        <!-- Внутренний контейнер для абсолютного позиционирования шагов -->
        <div class="absolute inset-0 w-full h-full">
          <Transition name="form-step">
            <div
v-if="step <= steps.length" :key="step"
                 class="absolute inset-0 w-full h-full flex flex-col pb-4"
                 :class="currentStepData.key === 'services' ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar'">
                 
                 <div
class="w-full flex flex-col transition-all duration-300"
                      :class="[
                        currentStepData.key === 'references' ? 'shrink-0 my-0 pt-1 pb-28' : '',
                        currentStepData.key === 'services' ? 'h-full shrink-0 my-0 pt-1' : (currentStepData.key !== 'references' ? 'shrink-0 mt-auto mb-auto' : '')
                      ]">
                   <h3
class="font-primary text-[1.25rem] md:text-[1.5rem] leading-[1.2] font-bold uppercase tracking-tight text-white text-balance w-full shrink-0"
                       :class="currentStepData.key === 'services' ? 'mb-4' : 'mb-6'">
                     {{ currentStepData.question }}
                   </h3>

                   <MobileContactDevModeSwitch
                     v-if="currentStepData.key === 'services'"
                     v-model="answers.devMode"
                     class="mb-4 shrink-0"
                   />

                   <MobileContactStepInput 
                     v-if="currentStepData.type === 'input'"
                     v-model="answers[currentStepData.key as 'contact' | 'name' | 'project' | 'budget']"
                     :is-textarea="currentStepData.key === 'project'"
                     :placeholder="currentStepData.placeholder"
                     class="w-full shrink-0"
                     @focus="onFocus"
                     @blur="onBlur"
                     @enter="nextStep"
                   />

                   <MobileContactStepPlaques
                     v-if="currentStepData.type === 'plaques'"
                     :options="currentStepData.options || []"
                     :selected-options="answers[currentStepData.key as 'services']"
                     :enable-custom-scroll="currentStepData.key === 'services'"
                     :class="currentStepData.key === 'services' ? 'w-full flex-1 min-h-0 relative' : 'w-full shrink-0'"
                     @toggle="toggleOption(currentStepData.key, $event, !!currentStepData.multi)"
                   />

                   <MobileContactStepReferences
                     v-if="currentStepData.type === 'references'"
                     :reference-urls="answers.referenceUrls"
                     :attached-files="answers.attachedFiles"
                     :placeholder="currentStepData.placeholder"
                     class="w-full shrink-0"
                     @add-url="addReferenceUrl"
                     @remove-url="removeReferenceUrl"
                     @attach-files="attachFiles"
                     @remove-file="removeFile"
                     @focus="onFocus"
                     @blur="onBlur"
                   />
                 </div>
            </div>
          </Transition>

          <Transition name="form-step">
            <div v-show="step > steps.length" class="absolute inset-0 w-full h-full flex flex-col justify-center">
              <ContactStepSuccess />
            </div>
          </Transition>
        </div>
      </div>

      <!-- Bottom Section: Navigation (Fixed) -->
      <div
class="flex flex-col items-center w-full shrink-0 z-20"
           :class="step <= steps.length ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'">
        
        <Transition name="error-fade">
          <div v-if="error" class="mb-4 flex items-center gap-3 px-4 py-3 border border-red-500/20 bg-red-500/10 rounded-xl w-full">
            <span class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse shrink-0"/>
            <span class="text-red-400/90 text-[0.6875rem] font-secondary uppercase tracking-widest leading-tight">{{ error }}</span>
          </div>
        </Transition>

        <!-- Согласие на обработку ПД (на шагах отправки: первый и последний) -->
        <Transition name="error-fade">
          <div v-if="step === 1 || step === steps.length" class="w-full mb-4">
            <LegalConsentCheckbox v-model="consent" :highlight="consentError" />
          </div>
        </Transition>

        <div class="flex items-center w-full justify-between gap-3">
          <!-- Левая кнопка: Назад (шаги 2-5) или Отправить (шаг 1) -->
          <div class="w-1/2 h-[3.5rem] relative">
            <Transition name="btn-swap">
              <!-- Шаг 1: Кнопка Отправить (если заполнено) -->
              <button 
                v-if="step === 1 && canProceed(1)" 
                class="absolute inset-0 w-full h-full rounded-full bg-white text-black font-secondary text-[0.75rem] tracking-widest uppercase font-bold flex items-center justify-center transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                @click="submitForm"
              >
                <span v-if="!isLoading">ОТПРАВИТЬ</span>
                <span v-else>...</span>
              </button>

              <!-- Шаг 2-5: Кнопка Назад -->
              <button 
                v-else-if="step > 1 && step <= steps.length" 
                class="absolute inset-0 w-full h-full rounded-full border border-white/10 bg-black/40 text-white font-secondary text-[0.75rem] tracking-widest uppercase font-bold flex items-center justify-center transition-all duration-300 active:bg-white/10"
                @click="prevStep"
              >
                НАЗАД
              </button>
            </Transition>
          </div>

          <!-- Правая кнопка: Далее / Пропустить -->
          <div class="w-1/2 h-[3.5rem] relative">
            <Transition name="btn-swap">
              <button 
                v-if="step <= steps.length"
                class="absolute inset-0 w-full h-full rounded-full font-secondary text-[0.75rem] tracking-widest uppercase font-bold flex items-center justify-center transition-all duration-300"
                :class="[
                  (!canProceed(step) || isLoading) ? 'opacity-30 pointer-events-none' : (step === steps.length ? 'active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'active:bg-white/10'),
                  step === steps.length ? 'bg-white text-black' : 'border border-white/10 bg-black/40 text-white'
                ]"
                @click="step === steps.length ? submitForm() : nextStep()"
              >
                <span v-if="isLoading">...</span>
                <span v-else-if="step === steps.length">ОТПРАВИТЬ</span>
                <span v-else>
                  <Transition name="text-fade" mode="out-in">
                    <span :key="(isStepEmpty(step) && step !== 1) ? 'skip' : 'next'">{{ (isStepEmpty(step) && step !== 1) ? 'ПРОПУСТИТЬ' : 'ДАЛЕЕ' }}</span>
                  </Transition>
                </span>
              </button>
            </Transition>
          </div>
        </div>

        <!-- Правовые ссылки (скрываются при активной клавиатуре) -->
        <Transition name="btn-swap">
          <LegalFooterLinks v-if="!isTyping" align="center" class="mt-5" />
        </Transition>
      </div>

      <!-- Контакты (внизу, если успех) -->
      <div
class="absolute bottom-8 w-full left-0 px-6 shrink-0 transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
           :class="step > steps.length ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'">
        <div class="flex flex-col gap-3 font-secondary text-base text-white/70 items-center text-center">
          <div class="flex flex-col items-center justify-center relative w-full">
            <button 
              type="button" 
              class="active:text-white transition-colors block border-b border-white/20 pb-1 touch-manipulation min-h-[2.75rem] flex items-center justify-center cursor-pointer focus:outline-none" 
              @click="copyEmail"
            >
              kvazarweb@gmail.com
            </button>
            <Transition name="copy-tooltip">
              <span v-if="copied" class="absolute -top-7 text-xs text-white/70 font-secondary tracking-[0.15em] uppercase px-2.5 py-1 rounded border border-white/10 bg-white/[0.04] backdrop-blur-md whitespace-nowrap pointer-events-none select-none">
                почта скопирована
              </span>
            </Transition>
          </div>
          <a href="https://t.me/kvazarweb" target="_blank" class="active:text-white transition-colors block border-b border-white/20 pb-1 touch-manipulation min-h-[2.75rem] flex items-center justify-center">
            @kvazarweb
          </a>
          <LegalFooterLinks align="center" class="mt-4" />
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useEventBus } from '~/composables/useEventBus'
import { useContactForm } from '~/composables/useContactForm'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'
import MobileContactStepInput from './MobileContactStepInput.vue'
import MobileContactStepPlaques from './MobileContactStepPlaques.vue'
import MobileContactStepReferences from './MobileContactStepReferences.vue'
import MobileContactDevModeSwitch from './MobileContactDevModeSwitch.vue'
import ContactStepSuccess from '~/components/sections/contact/ContactStepSuccess.vue'
import LegalConsentCheckbox from '~/components/legal/LegalConsentCheckbox.vue'
import LegalFooterLinks from '~/components/legal/LegalFooterLinks.vue'

defineOptions({ inheritAttrs: false })

const contactRef = ref<HTMLElement | null>(null)

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const copyEmail = async () => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText('kvazarweb@gmail.com')
    } else {
      throw new Error('Clipboard API unavailable')
    }
  } catch {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = 'kvazarweb@gmail.com'
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    } catch (e) {
      console.error('Failed to copy email', e)
    }
  }
  copied.value = true
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copied.value = false
  }, 2500)
}

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
})

const { isMenuOpenLocal, isMenuTransitioning } = useMenuVisibility()
const { emit, on } = useEventBus()
// Унифицированное появление/исчезновение контента секции
const { revealed } = useSectionReveal('[ Контакты ]')

const updateOrganicState = (tempStep?: number) => {
  emit('contact-state', { 
    active: true, 
    step: tempStep !== undefined ? tempStep : step.value, 
    typing: isTyping.value 
  })
}

const {
  step,
  isTyping,
  isLoading,
  error,
  consent,
  consentError,
  answers,
  steps,
  canProceed,
  isStepEmpty,
  toggleOption,
  addReferenceUrl,
  removeReferenceUrl,
  attachFiles,
  removeFile,
  onFocus,
  onBlur,
  nextStep,
  prevStep,
  submitForm
} = useContactForm(emit, updateOrganicState)

const currentStepData = computed(() => steps[step.value - 1]!)

let animationFrameId: number | null = null
const keyboardOffset = ref(0)
let closedHeight = 0

const updateKeyboardOffset = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  animationFrameId = requestAnimationFrame(() => {
    if (window.visualViewport) {
      const layoutHeight = window.innerHeight
      const vvHeight = window.visualViewport.height
      const vvTop = window.visualViewport.offsetTop
      // На iOS offset даст высоту клавиатуры, на Android это будет ~0
      let offset = layoutHeight - (vvHeight + vvTop)
      if (offset < 0) offset = 0
      keyboardOffset.value = offset

      // Отслеживание закрытия клавиатуры для сброса фокуса (возврат заголовков)
      if (!isTyping.value) {
        closedHeight = vvHeight
      } else {
        // Если высота вернулась почти к исходной (клавиатура закрылась)
        if (closedHeight > 0 && vvHeight >= closedHeight - 100) {
          if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            (document.activeElement as HTMLElement).blur()
          }
        }
      }
    }
  })
}

onMounted(() => {
  if (window.visualViewport) {
    closedHeight = window.visualViewport.height
    window.visualViewport.addEventListener('resize', updateKeyboardOffset)
    window.visualViewport.addEventListener('scroll', updateKeyboardOffset)
    updateKeyboardOffset()
  }

  on('section-change', (label: string) => {
    if (label === '[ Контакты ]') {
      updateOrganicState()
    } else {
      emit('contact-state', { active: false, step: 1, typing: false })
    }
  })
})

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', updateKeyboardOffset)
    window.visualViewport.removeEventListener('scroll', updateKeyboardOffset)
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.collapsible {
  display: grid;
}
.collapsible.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  pointer-events: auto;
}
.collapsible.is-closed {
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
}
.collapsible-inner {
  min-height: 0;
}

.touch-manipulation {
  touch-action: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Анимация ошибки */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.4s ease-out, transform 0.4s ease-out, max-height 0.4s ease-in-out, margin-bottom 0.4s ease-in-out;
  max-height: 5rem;
  overflow: hidden;
}
.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
  max-height: 0;
  margin-bottom: 0 !important;
}

/* Анимация переключения шагов анкеты - плавная */
.form-step-enter-active {
  transition: opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  transition-delay: 0.1s;
}
.form-step-leave-active {
  transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.form-step-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.form-step-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Плавная смена заголовка */
.title-fade-enter-active,
.title-fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.title-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.title-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Плавная смена кнопок */
.btn-swap-enter-active,
.btn-swap-leave-active {
  transition: opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
.btn-swap-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.btn-swap-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Плавная смена текста внутри кнопок */
.text-fade-enter-active,
.text-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.text-fade-enter-from {
  opacity: 0;
  transform: translateY(5px);
}
.text-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Плавное всплывающее уведомление "Почта скопирована" над кнопкой */
.copy-tooltip-enter-active,
.copy-tooltip-leave-active {
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), filter 0.35s ease;
}
.copy-tooltip-enter-from,
.copy-tooltip-leave-to {
  opacity: 0;
  transform: translateY(6px);
  filter: blur(4px);
}
</style>
