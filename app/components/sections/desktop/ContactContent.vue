<template>
  <section ref="contactRef" v-bind="$attrs" class="relative h-dvh w-full flex items-center justify-center overflow-hidden bg-transparent z-10 pointer-events-none"
           :class="[
             isMenuTransitioning ? 'transition-opacity' : '',
             isMenuOpenLocal ? '!opacity-0 duration-[600ms] delay-[200ms]' : (isMenuTransitioning ? 'duration-[800ms] delay-[400ms]' : '')
           ]">
    
    <div class="relative w-full max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center text-white pointer-events-none md:translate-y-0 2xl:-translate-y-20">
      
      <!-- Левая половина: Всё выстроено в одну линию -->
      <div class="reveal-item w-full md:w-1/2 flex flex-col justify-center pointer-events-none relative z-20 py-12 md:py-0 mix-blend-difference transform-gpu"
           :class="{ 'is-revealed': revealed }">
        
        <!-- Заголовок -->
        <div class="shrink-0 pointer-events-auto transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center"
             :class="step < 6 ? 'overflow-visible' : 'overflow-hidden'"
             :style="{ 
               maxHeight: step < 6 ? '15rem' : '0rem', 
               opacity: step < 6 ? 1 : 0
             }">
          <h2 class="font-primary text-6xl md:text-8xl lg:text-[clamp(4rem,6vw,9rem)] font-black uppercase tracking-tighter leading-[0.8] relative w-full h-[1em]">
            <Transition name="title-ticker">
              <span :key="step === 1 ? 'svyaz' : 'detali'" class="absolute top-0 left-0">
                {{ step === 1 ? 'СВЯЗЬ' : 'ДЕТАЛИ' }}
              </span>
            </Transition>
          </h2>
        </div>

        <!-- Интерактивный Бриф -->
        <div class="w-full mt-8 mb-8 pointer-events-none">
          
          <!-- Обертка брифа с динамической высотой -->
          <div ref="stepWrapperRef" class="relative w-full transition-[height] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]" :style="{ height: wrapperHeight }">
            <TransitionGroup name="form-step">
              <template v-for="(stepData, idx) in steps" :key="stepData.key">
                <div v-if="step === idx + 1"
                     :data-step="idx + 1"
                     class="absolute top-0 left-0 w-full flex flex-col items-start justify-center pointer-events-auto">
                   
                <!-- Прогресс -->
                <div class="text-[clamp(12px,0.65vw,13px)] font-secondary tracking-widest text-white/50 uppercase mb-6 flex items-center gap-4">
                  <span>Шаг {{ idx + 1 }} / {{ steps.length }}</span>
                  <div class="w-12 h-[1px] bg-white/20">
                    <div class="h-full bg-white transition-all duration-500" :style="{ width: `${((idx + 1) / steps.length) * 100}%` }"></div>
                  </div>
                </div>

                <h3 class="font-primary text-[clamp(1.75rem,2.8vw,3rem)] font-bold uppercase tracking-tight mb-8 leading-tight text-balance">
                  {{ stepData.question }}
                </h3>

                <ContactStepInput 
                  v-if="stepData.type === 'input'"
                  v-model="answers[stepData.key as keyof typeof answers]"
                  :is-textarea="idx === 2"
                  :placeholder="stepData.placeholder"
                  @focus="onFocus"
                  @blur="onBlur"
                  @enter="nextStep"
                />

                <ContactStepPlaques
                  v-if="stepData.type === 'plaques'"
                  :options="stepData.options || []"
                  :selected-options="answers[stepData.key as keyof typeof answers]"
                  @toggle="toggleOption(stepData.key, $event, !!stepData.multi)"
                />

                </div>
              </template>
            </TransitionGroup>

            <!-- Success Step -->
            <Transition name="form-step">
              <ContactStepSuccess v-show="step === 6" data-success-step="true" />
            </Transition>
          </div>

          <!-- Глобальная панель навигации по форме (скрывается плавно на последнем шаге) -->
          <div class="flex flex-col items-start transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] mt-8 w-full"
               :class="step <= steps.length ? 'opacity-100 blur-none pointer-events-auto' : 'opacity-0 blur-md pointer-events-none'">
            
            <Transition name="error-fade">
              <div v-if="error" class="mb-6 flex items-center gap-3 px-4 py-2.5 border border-red-500/20 bg-red-500/5 backdrop-blur-md rounded-xl md:rounded-full w-full md:w-max max-w-full pointer-events-none">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse shrink-0"></span>
                <span class="text-red-400/90 text-[10px] md:text-[11px] tracking-[0.15em] font-secondary uppercase leading-relaxed text-balance">{{ error }}</span>
              </div>
            </Transition>

            <TransitionGroup name="btn-group" tag="div" class="flex items-center relative w-full">
                <div v-if="step > 1 && step <= steps.length" key="back" class="flex items-center">
                  <button @click="prevStep" aria-label="Вернуться на предыдущий шаг" class="text-white/50 hover:text-white uppercase tracking-widest font-secondary text-[clamp(12px,0.65vw,13px)] pb-1 border-b border-transparent hover:border-white transition-all whitespace-nowrap min-w-[44px] min-h-[44px] flex items-center justify-center">
                    Назад
                  </button>
                  <div class="w-6"></div> <!-- Имитация gap-6 (24px) -->
                </div>

                <div v-if="(step === 1 || step > steps.length) && canProceed(1)" key="send" class="flex items-center mr-6">
                  <UiButton 
                    variant="accent"
                    class="!py-3 shrink-0" 
                    :class="(isLoading || isSuccess) ? 'pointer-events-none opacity-50' : ''"
                    @click="submitForm"
                  >
                    <div class="grid place-items-center font-secondary tracking-[0.1em] text-[12px] font-bold whitespace-nowrap">
                      <span class="col-start-1 row-start-1 transition-all duration-500" :class="(isLoading || isSuccess) ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'">
                        ОТПРАВИТЬ
                      </span>
                      <span class="col-start-1 row-start-1 transition-all duration-500" :class="(isLoading || isSuccess) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'">
                        ОТПРАВКА...
                      </span>
                    </div>
                  </UiButton>
                </div>

              <UiButton 
                key="next"
                class="magnetic-btn font-secondary !bg-transparent transition-all duration-500 !py-3 shrink-0 min-w-[10rem]" 
                :class="[
                  canProceed(step) ? '!text-white !border !border-white/20 hover:!border-transparent' : '!text-white/20 !border !border-transparent pointer-events-none',
                  isLoading ? 'pointer-events-none opacity-50' : ''
                ]"
                @click="nextStep"
              >
                <div class="relative w-32 h-5 flex items-center justify-center overflow-hidden">
                  <Transition name="text-ticker">
                    <span :key="isLoading ? 'loading' : (step >= steps.length ? 'submit' : (isStepEmpty(step) && step !== 1 ? 'skip' : 'next'))" class="absolute whitespace-nowrap font-secondary tracking-[0.1em] text-[clamp(10px,1vw,12px)] font-semibold">
                      {{ isLoading ? 'ОТПРАВКА...' : (step >= steps.length ? 'ОТПРАВИТЬ' : (isStepEmpty(step) && step !== 1 ? 'ПРОПУСТИТЬ' : 'ДАЛЕЕ')) }}
                    </span>
                  </Transition>
                </div>
              </UiButton>
            </TransitionGroup>
          </div>

        </div>

        <!-- Контакты (внизу) -->
        <div class="shrink-0 pointer-events-auto transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] delay-100"
             :class="step > steps.length ? '-translate-y-24' : 'translate-y-0'">
          <div class="flex flex-col gap-4 font-secondary text-lg md:text-xl text-white/70">
            <div class="flex items-center gap-4 relative">
              <button 
                type="button" 
                @click="copyEmail" 
                class="hover:text-white transition-colors w-max block border-b border-transparent hover:border-white pb-1 cursor-pointer text-left focus:outline-none"
              >
                kvazarweb@gmail.com
              </button>
              <Transition name="copy-tooltip">
                <span v-if="copied" class="text-xs text-white/70 font-secondary tracking-[0.15em] uppercase px-2.5 py-1 rounded border border-white/10 bg-white/[0.04] backdrop-blur-md whitespace-nowrap pointer-events-none select-none">
                  почта скопирована
                </span>
              </Transition>
            </div>
            <a href="https://t.me/kvazarweb" target="_blank" class="hover:text-white transition-colors w-max block border-b border-transparent hover:border-white pb-1">
              @kvazarweb
            </a>
          </div>
        </div>
        
      </div>

      <!-- Правая половина: Пустая (для живой сферы) -->
      <div class="hidden md:block w-full md:w-1/2 pointer-events-none"></div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useEventBus } from '~/composables/useEventBus'
import { useContactForm } from '~/composables/useContactForm'
import { useMenuVisibility } from '~/composables/useMenuVisibility'
import { useSectionReveal } from '~/composables/useSectionReveal'
import ContactStepInput from '~/components/sections/contact/ContactStepInput.vue'
import ContactStepPlaques from '~/components/sections/contact/ContactStepPlaques.vue'
import ContactStepSuccess from '~/components/sections/contact/ContactStepSuccess.vue'

defineOptions({ inheritAttrs: false })

const contactRef = ref<HTMLElement | null>(null)
const stepWrapperRef = ref<HTMLElement | null>(null)
const wrapperHeight = ref('auto')

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const copyEmail = async () => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText('kvazarweb@gmail.com')
    } else {
      throw new Error('Clipboard API unavailable')
    }
  } catch (err) {
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
  isSuccess,
  error,
  answers,
  steps,
  canProceed,
  isStepEmpty,
  toggleOption,
  onFocus,
  onBlur,
  nextStep,
  prevStep,
  submitForm
} = useContactForm(emit, updateOrganicState)

const updateHeight = async () => {
  await nextTick()
  if (!stepWrapperRef.value) return
  
  setTimeout(() => {
    const currentEl = stepWrapperRef.value?.querySelector(`[data-step="${step.value}"]`) ||
                      stepWrapperRef.value?.querySelector('[data-success-step]')
    if (currentEl) {
      wrapperHeight.value = `${(currentEl as HTMLElement).offsetHeight}px`
    }
  }, 10)
}

watch(step, () => {
  updateHeight()
})

onMounted(() => {
  updateHeight()

  on('section-change', (label: string) => {
    if (label === '[ Контакты ]') {
      updateOrganicState()
    } else {
      emit('contact-state', { active: false, step: 1, typing: false })
    }
  })
})
</script>

<style scoped>
/* Анимация ошибки */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out, max-height 0.5s ease-in-out, margin-bottom 0.5s ease-in-out;
  max-height: 100px;
  overflow: hidden;
}
.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
  max-height: 0;
  margin-bottom: 0 !important;
}

/* Анимация переключения шагов анкеты */
.form-step-enter-active {
  transition: opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s, filter 0.6s ease-out 0.1s;
}
.form-step-leave-active {
  transition: opacity 0.4s ease-in, transform 0.4s ease-in, filter 0.4s ease-in;
}
.form-step-enter-from {
  opacity: 0;
  transform: translateY(15px);
  filter: blur(8px);
}
.form-step-leave-to {
  opacity: 0;
  transform: translateY(-15px);
  filter: blur(8px);
}

/* Анимация кнопок в анкете (TransitionGroup FLIP) */
.btn-group-move,
.btn-group-enter-active,
.btn-group-leave-active {
  transition: opacity 0.6s ease-out, transform 0.6s ease-out, filter 0.6s ease-out;
}

.btn-group-leave-active {
  position: absolute; /* Убираем из потока при исчезновении, чтобы контейнер не растягивался на две кнопки */
}

/* Общее скрытие кнопок */
.btn-group-enter-from,
.btn-group-leave-to {
  opacity: 0 !important;
  transform: translateY(15px) !important;
  filter: blur(8px) !important;
}

/* Плавная смена текста внутри кнопки (ticker) */
.text-ticker-enter-active,
.text-ticker-leave-active {
  transition: opacity 0.5s ease-out, transform 0.5s ease-out;
}
.text-ticker-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.text-ticker-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* Плавная смена текста заголовка (title-ticker) */
.title-ticker-enter-active,
.title-ticker-leave-active {
  transition: opacity 0.7s ease-out, transform 0.7s ease-out, filter 0.7s ease-out;
}
.title-ticker-enter-from {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(8px);
}
.title-ticker-leave-to {
  opacity: 0;
  transform: translateY(-20px);
  filter: blur(8px);
}



/* Убираем синий/желтый фон автозаполнения Chrome (Autofill Hack) */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
textarea:-webkit-autofill:active {
  -webkit-text-fill-color: white !important;
  -webkit-box-shadow: 0 0 0px 1000px #000 inset !important;
  background-color: transparent !important;
  transition: background-color 5000s ease-in-out 0s;
}

/* Плавное появление надписи "Почта скопирована" */
.copy-tooltip-enter-active,
.copy-tooltip-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease;
}
.copy-tooltip-enter-from,
.copy-tooltip-leave-to {
  opacity: 0;
  transform: translateX(-10px);
  filter: blur(4px);
}
</style>
