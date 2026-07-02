<template>
  <div class="w-full flex flex-col gap-4">
    <!-- 1. Поле ввода сайтов -->
    <div class="w-full flex items-center gap-2 border-b-2 border-white/20 focus-within:border-white transition-colors duration-500 pb-2">
      <input 
        v-model="inputUrl"
        type="text" 
        class="min-w-0 flex-1 bg-transparent text-base sm:text-lg font-secondary text-left text-white outline-none focus:outline-none ring-0 placeholder-white/30"
        :placeholder="placeholder || 'Сайт (например, apple.com)'"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
        @keydown.enter.prevent="handleAddUrl"
      >
      <button 
        type="button"
        :disabled="referenceUrls.length >= 4"
        :class="referenceUrls.length >= 4 ? 'opacity-30 pointer-events-none' : 'active:bg-white active:text-black'"
        class="shrink-0 uppercase tracking-widest font-secondary text-[0.6875rem] px-3.5 py-2 min-h-[36px] flex items-center justify-center rounded-full border border-white/30 transition-all duration-300"
        @click.prevent="handleAddUrl"
      >
        + Добавить
      </button>
    </div>

    <!-- 2. Ошибка добавления URL или файла -->
    <Transition name="fade">
      <div v-if="localError" class="text-red-400 text-[0.6875rem] font-secondary uppercase tracking-widest">
        {{ localError }}
      </div>
    </Transition>

    <!-- 3. Список добавленных сайтов (компактные колбы строго с вводом пользователя) -->
    <div 
      class="grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      :class="referenceUrls.length > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden">
        <div class="pt-1 pb-0.5">
          <TransitionGroup name="list" tag="div" class="flex flex-wrap gap-1.5 relative">
            <div 
              v-for="(url, idx) in referenceUrls" 
              :key="url"
              class="flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-full border border-white/30 bg-white/10 text-white font-secondary text-[0.7rem] transition-all"
            >
              <a :href="url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url" target="_blank" class="truncate max-w-[150px] sm:max-w-[190px]" @click.stop>{{ url }}</a>
              <button 
                type="button"
                aria-label="Удалить ссылку"
                class="text-white/60 active:text-white ml-0.5 font-bold text-sm min-w-[24px] min-h-[24px] flex items-center justify-center"
                @click.prevent="$emit('removeUrl', idx)"
              >&times;</button>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>

    <!-- 4. Кнопка прикрепления файлов и плавно появляющаяся кнопка сброса слева -->
    <div class="flex flex-col gap-1.5 pt-1">
      <input 
        ref="fileInputRef"
        type="file" 
        multiple
        accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        class="hidden"
        @change="handleFileChange"
      >
      
      <!-- Кнопка прикрепления файлов (всегда на экране, отключается при достижении лимита 4) -->
      <button 
        type="button"
        :disabled="attachedFiles.length >= 4"
        :class="attachedFiles.length >= 4 ? 'opacity-40 pointer-events-none' : 'active:bg-white active:text-black cursor-pointer'"
        class="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 min-h-[44px] rounded-full border border-white/40 bg-white/[0.05] transition-all duration-300 shadow-sm"
        @click.prevent="openFileDialog"
      >
        <span class="text-base shrink-0">📎</span>
        <span class="font-secondary text-xs tracking-widest uppercase font-medium">Прикрепить файлы</span>
        <span class="text-[0.65rem] font-secondary tracking-wider opacity-60">
          ({{ attachedFiles.length > 0 ? `${attachedFiles.length}/4` : 'до 4 шт.' }})
        </span>
      </button>

      <!-- Компактная кнопка сброса, плавно раскрывающаяся слева -->
      <div 
        class="grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        :class="attachedFiles.length > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
      >
        <div class="overflow-hidden flex justify-start">
          <div class="pt-1 pb-0.5">
            <button 
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[30px] rounded-full border border-red-400/30 bg-red-500/10 active:bg-red-500/25 text-red-300 font-secondary text-[0.65rem] tracking-wider uppercase font-medium transition-all duration-300"
              @click.prevent="resetFiles"
            >
              <span>✕ Сбросить файлы ({{ attachedFiles.length }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import type { AttachedFileItem } from '~/composables/useContactForm'

const props = defineProps<{
  referenceUrls: string[]
  attachedFiles: AttachedFileItem[]
  placeholder?: string
}>()

const emit = defineEmits<{
  addUrl: [url: string]
  removeUrl: [idx: number]
  attachFiles: [files: FileList | File[]]
  removeFile: [id: string]
  focus: []
  blur: []
}>()

const inputUrl = ref('')
const localError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
let errorTimeout: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (errorTimeout) {
    clearTimeout(errorTimeout)
    errorTimeout = null
  }
})

const showError = (msg: string) => {
  if (errorTimeout) clearTimeout(errorTimeout)
  localError.value = msg
  errorTimeout = setTimeout(() => {
    localError.value = null
    errorTimeout = null
  }, 4000)
}

const handleAddUrl = () => {
  const raw = inputUrl.value.trim()
  if (!raw) return
  
  if (props.referenceUrls.length >= 4) {
    showError('Можно добавить не более 4 сайтов')
    return
  }

  if (raw.toLowerCase().startsWith('javascript:') || raw.toLowerCase().startsWith('data:')) {
    showError('Недопустимый формат ссылки')
    return
  }

  let testUrl = raw
  if (!/^https?:\/\//i.test(testUrl)) {
    testUrl = 'https://' + testUrl
  }

  try {
    const urlObj = new URL(testUrl)
    if (!urlObj.hostname || urlObj.hostname.length < 3 || !urlObj.hostname.includes('.')) {
      showError('Введите корректный домен (например, site.com)')
      return
    }
    if (props.referenceUrls.includes(raw)) {
      showError('Этот сайт уже добавлен')
      return
    }
    emit('addUrl', raw)
    inputUrl.value = ''
    localError.value = null
  } catch {
    showError('Некорректный адрес сайта')
  }
}

const openFileDialog = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    emit('attachFiles', target.files)
    target.value = ''
  }
}

const resetFiles = () => {
  [...props.attachedFiles].forEach(item => {
    emit('removeFile', item.id)
  })
}
</script>

<style scoped>
input {
  outline: none !important;
  box-shadow: none !important;
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.95);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.list-leave-active {
  position: absolute;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
