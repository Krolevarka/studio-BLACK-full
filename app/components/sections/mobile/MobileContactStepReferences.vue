<template>
  <div class="w-full flex flex-col gap-5">
    <!-- 1. Поле ввода сайтов -->
    <div class="w-full relative flex items-center border-b-2 border-white/20 focus-within:border-white transition-colors duration-500 pb-3">
      <input 
        v-model="inputUrl"
        type="text" 
        @focus="$emit('focus')"
        @blur="$emit('blur')"
        @keydown.enter.prevent="handleAddUrl"
        class="w-full bg-transparent text-[1.125rem] font-secondary text-left text-white outline-none focus:outline-none ring-0 placeholder-white/30 pr-28"
        :placeholder="placeholder || 'Сайт (например, apple.com)'"
      >
      <button 
        @click.prevent="handleAddUrl"
        type="button"
        class="absolute right-0 uppercase tracking-widest font-secondary text-[0.7rem] px-4 py-2.5 min-h-[44px] flex items-center justify-center rounded-full border border-white/30 active:bg-white active:text-black transition-all duration-300"
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

    <!-- 3. Список добавленных сайтов (контейнер с плавным изменением высоты) -->
    <div 
      class="transition-[height,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden"
      :class="referenceUrls.length > 0 ? 'opacity-100 -mt-1.5' : 'opacity-0 mt-0'"
      :style="{ height: referenceUrls.length > 0 ? refsHeight : '0px' }"
    >
      <div ref="refsInnerRef" class="pt-1 pb-1.5">
        <TransitionGroup name="list" tag="div" class="flex flex-wrap gap-2 relative">
          <div 
            v-for="(url, idx) in referenceUrls" 
            :key="url"
            class="flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-full border border-white/30 bg-white/10 text-white font-secondary text-xs transition-all"
          >
            <a :href="url" target="_blank" class="truncate max-w-[180px]" @click.stop>{{ url }}</a>
            <button 
              @click.prevent="$emit('removeUrl', idx)"
              type="button"
              aria-label="Удалить ссылку"
              class="text-white/60 active:text-white ml-1 font-bold text-base min-w-[28px] min-h-[28px] flex items-center justify-center"
            >&times;</button>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- 4. Кнопка прикрепления файлов -->
    <div class="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <input 
        ref="fileInputRef"
        type="file" 
        multiple
        accept=".jpg,.jpeg,.png,.webp,.svg,.pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        class="hidden"
        @change="handleFileChange"
      >
      <Transition name="btn-bounce" mode="out-in">
        <button 
          v-if="attachedFiles.length < 4"
          @click.prevent="openFileDialog"
          type="button"
          class="w-full inline-flex items-center justify-center gap-3 px-5 py-4 min-h-[48px] rounded-full border border-white/40 bg-white/[0.05] active:bg-white active:text-black transition-all duration-300 cursor-pointer shadow-sm"
        >
          <span class="text-base shrink-0">📎</span>
          <span class="font-secondary text-xs tracking-widest uppercase font-medium">Прикрепить файлы</span>
          <span class="text-[0.65rem] font-secondary tracking-wider opacity-60">
            ({{ attachedFiles.length }}/4)
          </span>
        </button>
      </Transition>
    </div>

    <!-- 5. Список прикрепленных файлов (контейнер с плавным изменением высоты) -->
    <div 
      class="transition-[height,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden"
      :class="attachedFiles.length > 0 ? 'opacity-100 -mt-1.5' : 'opacity-0 mt-0'"
      :style="{ height: attachedFiles.length > 0 ? filesHeight : '0px' }"
    >
      <div ref="filesInnerRef" class="pt-1 pb-1">
        <TransitionGroup name="list" tag="div" class="flex flex-col gap-2.5 relative">
          <div 
            v-for="item in attachedFiles" 
            :key="item.id"
            class="flex items-center justify-between p-3 min-h-[52px] rounded-xl border border-white/20 bg-white/[0.06] gap-3"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10 flex items-center justify-center border border-white/10">
                <img v-if="item.previewUrl" :src="item.previewUrl" :alt="item.name" class="w-full h-full object-cover">
                <span v-else class="text-xs font-bold uppercase tracking-tighter text-white/70">{{ getFileIcon(item.name) }}</span>
              </div>
              <div class="flex flex-col min-w-0 flex-1">
                <span class="font-secondary text-xs text-white truncate w-full">{{ item.name }}</span>
                <span class="font-secondary text-[10px] text-white/50">{{ formatSize(item.size) }}</span>
              </div>
            </div>
            <button 
              @click.prevent="$emit('removeFile', item.id)"
              type="button"
              aria-label="Удалить файл"
              class="w-9 h-9 rounded-full flex items-center justify-center text-white/50 active:text-white active:bg-white/10 transition-all shrink-0 font-bold text-lg"
            >&times;</button>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { AttachedFileItem } from '~/composables/useContactForm'

const props = defineProps<{
  referenceUrls: string[]
  attachedFiles: AttachedFileItem[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'addUrl', url: string): void
  (e: 'removeUrl', idx: number): void
  (e: 'attachFiles', files: FileList | File[]): void
  (e: 'removeFile', id: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const inputUrl = ref('')
const localError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
let errorTimeout: ReturnType<typeof setTimeout> | null = null

const refsInnerRef = ref<HTMLElement | null>(null)
const refsHeight = ref('0px')
let refsObserver: ResizeObserver | null = null

const filesInnerRef = ref<HTMLElement | null>(null)
const filesHeight = ref('0px')
let filesObserver: ResizeObserver | null = null

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    refsObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement
        refsHeight.value = `${target.offsetHeight + 4}px`
      }
    })
    if (refsInnerRef.value) refsObserver.observe(refsInnerRef.value)

    filesObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement
        filesHeight.value = `${target.offsetHeight + 6}px`
      }
    })
    if (filesInnerRef.value) filesObserver.observe(filesInnerRef.value)
  }
})

onBeforeUnmount(() => {
  if (errorTimeout) {
    clearTimeout(errorTimeout)
    errorTimeout = null
  }
  if (refsObserver) {
    refsObserver.disconnect()
    refsObserver = null
  }
  if (filesObserver) {
    filesObserver.disconnect()
    filesObserver = null
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
  
  if (props.referenceUrls.length >= 5) {
    showError('Можно добавить не более 5 сайтов')
    return
  }

  let cleaned = raw
  if (cleaned.toLowerCase().startsWith('javascript:') || cleaned.toLowerCase().startsWith('data:')) {
    showError('Недопустимый формат ссылки')
    return
  }

  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = 'https://' + cleaned
  }

  try {
    const urlObj = new URL(cleaned)
    if (!urlObj.hostname || urlObj.hostname.length < 3 || !urlObj.hostname.includes('.')) {
      showError('Введите корректный домен (например, site.com)')
      return
    }
    if (props.referenceUrls.includes(cleaned)) {
      showError('Этот сайт уже добавлен')
      return
    }
    emit('addUrl', cleaned)
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

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

const getFileIcon = (filename: string): string => {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.pdf')) return 'PDF'
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'DOC'
  return 'FILE'
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
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.92);
}
.list-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
.list-leave-active {
  position: absolute;
}

.btn-bounce-enter-active,
.btn-bounce-leave-active {
  transition: all 0.4s ease;
}
.btn-bounce-enter-from,
.btn-bounce-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
