import { ref, reactive, onBeforeUnmount } from 'vue'

export interface ContactAnswers {
  name: string
  services: string[]
  project: string
  budget: string
  contact: string
}

import { useEventBus } from '~/composables/useEventBus'
import { productModuleNames } from '~/data/productBuilderOptions'

export function useContactForm(emit: ReturnType<typeof useEventBus>['emit'], updateOrganicState: (step?: number) => void) {
  const step = ref(1)
  const isTyping = ref(false)
  const isLoading = ref(false)
  const isSuccess = ref(false)
  const isTransitioningStep = ref(false)
  const error = ref<string | null>(null)
  
  const timeoutIds: ReturnType<typeof setTimeout>[] = []
  
  onBeforeUnmount(() => {
    timeoutIds.forEach(clearTimeout)
  })

  const { on } = useEventBus()
  
  const answers = reactive<ContactAnswers>({
    name: '',
    services: [],
    project: '',
    budget: '',
    contact: ''
  })

  // Синхронизация билдера проекта с анкетой
  on('price-update', (payload) => {
    answers.services = payload.options
      .filter(opt => opt.selected)
      .map(opt => opt.name)
  })

  const steps = [
    { key: 'contact', type: 'input', question: 'Как с вами связаться?', placeholder: 'Telegram, Phone или Email' },
    { key: 'name', type: 'input', question: 'Как мы можем к вам обращаться?', placeholder: 'Имя или Название компании' },
    { key: 'services', type: 'plaques', question: 'Какие модули нужны в проекте?', multi: true, options: productModuleNames },
    { key: 'project', type: 'input', question: 'Кратко опишите задачу вашего проекта', placeholder: 'Суть проекта в двух предложениях' },
    { key: 'budget', type: 'plaques', question: 'Какой у вас планируемый бюджет?', multi: false, options: ['< 500 тыс. ₽', '500к - 1М ₽', '1М - 3М ₽', '> 3М ₽'] }
  ]

  const canProceed = (s: number) => {
    if (s === 1) return answers.contact.trim().length > 0
    return true // Шаги 2-5 можно пропустить
  }

  const isStepEmpty = (s: number) => {
    if (s === 1) return answers.contact.trim().length === 0
    if (s === 2) return answers.name.trim().length === 0
    if (s === 3) return answers.services.length === 0
    if (s === 4) return answers.project.trim().length === 0
    if (s === 5) return answers.budget === ''
    return false
  }



  const toggleOption = (key: string, opt: string, multi: boolean) => {
    switch (key) {
      case 'services': {
        const idx = answers.services.indexOf(opt)
        if (idx > -1) answers.services.splice(idx, 1)
        else answers.services.push(opt)
        break
      }
      case 'name':
        answers.name = opt
        break
      case 'project':
        answers.project = opt
        break
      case 'budget':
        answers.budget = opt
        break
      case 'contact':
        answers.contact = opt
        break
    }
  }

  const onFocus = () => {
    isTyping.value = true
    updateOrganicState()
  }

  const onBlur = () => {
    isTyping.value = false
    updateOrganicState()
  }

  const submitForm = async () => {
    if (isLoading.value) return
    const sanitized = {
      name: String(answers.name).slice(0, 200).trim() || 'Не указано',
      services: answers.services.length > 0 ? [...answers.services] : ['Не указано'],
      project: String(answers.project).slice(0, 2000).trim() || 'Не указано',
      budget: answers.budget || 'Не указано',
      contact: String(answers.contact).slice(0, 200).trim()
    }
    
    if (!sanitized.contact) return
    
    isLoading.value = true
    error.value = null
    
    try {
      await $fetch('/api/contact', {
        method: 'POST',
        body: sanitized
      })
      
      isSuccess.value = true
      updateOrganicState(6)
      const id = setTimeout(() => {
        step.value = 6 
      }, 800)
      timeoutIds.push(id)
    } catch (err: unknown) {
      interface FetchErrorLike {
        status?: number
        statusCode?: number
        statusMessage?: string
        response?: { status?: number; _data?: { statusMessage?: string } }
      }
      const fetchErr = err as FetchErrorLike
      const status = fetchErr?.status || fetchErr?.statusCode || fetchErr?.response?.status
      const msg = fetchErr?.statusMessage || fetchErr?.response?._data?.statusMessage

      if (err instanceof TypeError && err.message.includes('fetch')) {
        error.value = 'Ошибка сети. Проверьте подключение к интернету или сервер временно недоступен.'
      } else if (status === 429) {
        error.value = 'Вы недавно уже отправляли анкету. Пожалуйста, подождите 15 минут перед повторной отправкой.'
      } else if (msg) {
        error.value = msg
      } else {
        error.value = 'Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз.'
      }
      console.error('Submit error:', err)
    } finally {
      isLoading.value = false
    }
  }

  const nextStep = () => {
    if (!canProceed(step.value) || isTransitioningStep.value) return
    if (step.value === steps.length) {
      submitForm()
      return
    }
    
    isTransitioningStep.value = true
    updateOrganicState(step.value + 1) 
    const id = setTimeout(() => {
      step.value++
      isTransitioningStep.value = false
    }, 600)
    timeoutIds.push(id)
  }

  const prevStep = () => {
    if (step.value > 1 && !isTransitioningStep.value) {
      isTransitioningStep.value = true
      updateOrganicState(step.value - 1)
      const id = setTimeout(() => {
        step.value--
        isTransitioningStep.value = false
      }, 600)
      timeoutIds.push(id)
    }
  }

  return {
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
  }
}
