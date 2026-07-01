import { ref, reactive, watch, onBeforeUnmount } from 'vue'
import { usePriceDevMode, type DevModeType } from '~/composables/usePriceDevMode'

export interface AttachedFileItem {
  id: string
  file: File
  name: string
  size: number
  type: string
  previewUrl?: string
}

export interface ContactAnswers {
  name: string
  services: string[]
  project: string
  budget: string
  contact: string
  devMode: DevModeType
  referenceUrls: string[]
  attachedFiles: AttachedFileItem[]
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
    answers.attachedFiles.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
    })
  })

  const { on } = useEventBus()
  const { priceDevMode, setMode } = usePriceDevMode()
  
  const answers = reactive<ContactAnswers>({
    name: '',
    services: [],
    project: '',
    budget: '',
    contact: '',
    devMode: priceDevMode.value,
    referenceUrls: [],
    attachedFiles: []
  })

  watch(priceDevMode, (newVal) => {
    answers.devMode = newVal
  })

  watch(() => answers.devMode, (newVal) => {
    if (priceDevMode.value !== newVal) {
      setMode(newVal)
    }
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
    { key: 'references', type: 'references', question: 'Понравившиеся сайты и файлы', placeholder: 'Введите URL сайта (например, apple.com)' },
    { key: 'budget', type: 'plaques', question: 'Какой у вас планируемый бюджет?', multi: false, options: ['< 500 тыс. ₽', '500к - 1М ₽', '1М - 3М ₽', '> 3М ₽'] }
  ]

  const canProceed = (s: number) => {
    if (s === 1) return answers.contact.trim().length > 0
    return true // Шаги 2-6 можно пропустить
  }

  const isStepEmpty = (s: number) => {
    if (s === 1) return answers.contact.trim().length === 0
    if (s === 2) return answers.name.trim().length === 0
    if (s === 3) return answers.services.length === 0
    if (s === 4) return answers.project.trim().length === 0
    if (s === 5) return answers.referenceUrls.length === 0 && answers.attachedFiles.length === 0
    if (s === 6) return answers.budget === ''
    return false
  }

  const addReferenceUrl = (rawUrl: string): { success: boolean; error?: string } => {
    if (answers.referenceUrls.length >= 5) {
      return { success: false, error: 'Можно добавить не более 5 сайтов' }
    }
    let cleaned = rawUrl.trim()
    if (!cleaned) return { success: false, error: 'Введите URL адреса' }
    
    if (cleaned.toLowerCase().startsWith('javascript:') || cleaned.toLowerCase().startsWith('data:')) {
      return { success: false, error: 'Недопустимый формат ссылки' }
    }
    
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'https://' + cleaned
    }

    try {
      const urlObj = new URL(cleaned)
      if (!urlObj.hostname || urlObj.hostname.length < 3 || !urlObj.hostname.includes('.')) {
        return { success: false, error: 'Введите корректный домен (например, site.com)' }
      }
      if (answers.referenceUrls.includes(cleaned)) {
        return { success: false, error: 'Этот сайт уже добавлен' }
      }
      answers.referenceUrls.push(cleaned)
      return { success: true }
    } catch {
      return { success: false, error: 'Некорректный адрес сайта' }
    }
  }

  const removeReferenceUrl = (index: number) => {
    if (index >= 0 && index < answers.referenceUrls.length) {
      answers.referenceUrls.splice(index, 1)
    }
  }

  const attachFiles = (newFiles: FileList | File[]): { added: number; error?: string } => {
    const fileArray = Array.from(newFiles)
    if (answers.attachedFiles.length >= 4) {
      return { added: 0, error: 'Максимум 4 файла' }
    }

    const availableSlots = 4 - answers.attachedFiles.length
    const toProcess = fileArray.slice(0, availableSlots)
    let addedCount = 0
    let lastError: string | undefined

    const allowedMimePrefixes = ['image/']
    const allowedExactMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf', '.doc', '.docx']
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

    for (const file of toProcess) {
      if (file.size > MAX_SIZE) {
        lastError = `Файл "${file.name}" превышает лимит в 5 МБ`
        continue
      }

      const lowerName = file.name.toLowerCase()
      const hasAllowedExt = allowedExtensions.some(ext => lowerName.endsWith(ext))
      const isAllowedMime = allowedMimePrefixes.some(prefix => file.type.startsWith(prefix)) || allowedExactMimes.includes(file.type)

      if (!hasAllowedExt && !isAllowedMime) {
        lastError = `Формат "${file.name}" не поддерживается (только Фото, PDF, Word)`
        continue
      }

      const id = Math.random().toString(36).substring(2, 11)
      let previewUrl: string | undefined
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file)
      }

      answers.attachedFiles.push({
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        previewUrl
      })
      addedCount++
    }

    if (fileArray.length > availableSlots && !lastError) {
      lastError = 'Добавлено максимально возможное количество файлов (4)'
    }

    return { added: addedCount, error: lastError }
  }

  const removeFile = (id: string) => {
    const idx = answers.attachedFiles.findIndex(item => item.id === id)
    if (idx !== -1) {
      const item = answers.attachedFiles[idx]
      if (item && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl)
      }
      answers.attachedFiles.splice(idx, 1)
    }
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
    const sanitizedName = String(answers.name).slice(0, 200).trim() || 'Не указано'
    const sanitizedServices = answers.services.length > 0 ? answers.services : ['Не указано']
    const sanitizedProject = String(answers.project).slice(0, 2000).trim() || 'Не указано'
    const sanitizedBudget = answers.budget || 'Не указано'
    const sanitizedContact = String(answers.contact).slice(0, 200).trim()
    const sanitizedDevMode = answers.devMode === 'ai' ? 'AI-Сборка (-30%)' : 'Ручная классическая разработка'
    
    if (!sanitizedContact) return
    
    isLoading.value = true
    error.value = null
    
    try {
      const formData = new FormData()
      formData.append('name', sanitizedName)
      formData.append('project', sanitizedProject)
      formData.append('budget', sanitizedBudget)
      formData.append('contact', sanitizedContact)
      formData.append('devMode', sanitizedDevMode)
      
      sanitizedServices.forEach(s => {
        formData.append('services', s)
      })
      
      answers.referenceUrls.forEach(url => {
        formData.append('referenceUrls', url)
      })

      answers.attachedFiles.forEach(item => {
        formData.append('files', item.file, item.name)
      })

      await $fetch('/api/contact', {
        method: 'POST',
        body: formData
      })
      
      isSuccess.value = true
      updateOrganicState(7)
      const id = setTimeout(() => {
        step.value = 7 
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
    addReferenceUrl,
    removeReferenceUrl,
    attachFiles,
    removeFile,
    toggleOption,
    onFocus,
    onBlur,
    nextStep,
    prevStep,
    submitForm
  }
}

