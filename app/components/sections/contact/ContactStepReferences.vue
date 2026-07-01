<template>
  <div class="w-full flex flex-col gap-6">
    <!-- 1. Поле ввода сайтов -->
    <div class="w-full relative flex items-center border-b border-white/30 focus-within:border-white transition-colors pb-3">
      <input 
        v-model="inputUrl"
        type="text" 
        @focus="$emit('focus')"
        @blur="$emit('blur')"
        @keydown.enter.prevent="handleAddUrl"
        class="w-full bg-transparent text-xl md:text-2xl font-secondary text-left text-white outline-none focus:outline-none ring-0 placeholder-white/20 pr-28"
        :placeholder="placeholder || 'Введите URL сайта (например, apple.com)'"
      >
      <button 
        @click.prevent="handleAddUrl"
        type="button"
        class="absolute right-0 uppercase tracking-widest font-secondary text-xs px-4 py-1.5 rounded-full border border-white/30 hover:border-white hover:bg-white hover:text-black transition-all duration-300"
      >
        + Добавить
      </button>
    </div>

    <!-- 2. Ошибка добавления URL или файла (плавное появление) -->
    <Transition name="fade">
      <div v-if="localError" class="text-red-400/90 text-xs font-secondary uppercase tracking-widest">
        {{ localError }}
      </div>
    </Transition>

    <!-- 3. Список добавленных сайтов (контейнер с плавным анимационным изменением высоты) -->
    <div 
      class="transition-[height,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden"
      :class="referenceUrls.length > 0 ? 'opacity-100 -mt-2' : 'opacity-0 mt-0'"
      :style="{ height: referenceUrls.length > 0 ? refsHeight : '0px' }"
    >
      <div ref="refsInnerRef" class="pt-1 pb-2">
        <TransitionGroup name="list" tag="div" class="flex flex-wrap gap-2.5 relative">
          <div 
            v-for="(url, idx) in referenceUrls" 
            :key="url"
            class="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/5 backdrop-blur-md text-white font-secondary text-xs md:text-sm transition-all hover:border-white/60 group"
          >
            <a :href="url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url" target="_blank" class="hover:underline truncate max-w-[220px]" @click.stop>{{ url }}</a>
            <button 
              @click.prevent="$emit('removeUrl', idx)"
              type="button"
              aria-label="Удалить ссылку"
              class="text-white/40 group-hover:text-white transition-colors ml-1 font-bold text-base leading-none"
            >&times;</button>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- 4. Кнопка "Прикрепить файлы" (плавно смещается за счет верхнего контейнера) -->
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
          class="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-full border border-white/40 bg-white/[0.03] hover:bg-white hover:text-black hover:border-white transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
        >
          <span class="text-lg transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 shrink-0">📎</span>
          <span class="font-secondary text-xs md:text-sm tracking-widest uppercase font-medium">Прикрепить файлы</span>
          <span class="text-[10px] font-secondary tracking-wider opacity-50 group-hover:opacity-80 ml-1">
            ({{ attachedFiles.length }}/4 • Фото, PDF, Word)
          </span>
        </button>
      </Transition>
    </div>

    <!-- 5. Список прикрепленных файлов (контейнер с плавным анимационным изменением высоты) -->
    <div 
      class="transition-[height,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden"
      :class="attachedFiles.length > 0 ? 'opacity-100 -mt-2' : 'opacity-0 mt-0'"
      :style="{ height: attachedFiles.length > 0 ? filesHeight : '0px' }"
    >
      <div ref="filesInnerRef" class="pt-1 pb-1">
        <TransitionGroup name="list" tag="div" class="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
          <div 
            v-for="item in attachedFiles" 
            :key="item.id"
            class="flex items-center justify-between p-3 rounded-xl border border-white/20 bg-white/[0.04] backdrop-blur-md transition-all hover:border-white/50 gap-3"
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
              class="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0 font-bold text-base"
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
  transition: all 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.92);
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
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.btn-bounce-enter-from,
.btn-bounce-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
