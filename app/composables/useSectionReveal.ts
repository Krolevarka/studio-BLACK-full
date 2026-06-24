import { computed, ref, watch, onBeforeUnmount } from 'vue'
import { useSectionTransition } from '~/composables/useSectionTransition'

/**
 * Унифицированное появление/исчезновение контента секции.
 *
 * Заменяет разрозненные подходы (isReady + preloader, isVisible + IntersectionObserver,
 * GSAP-таймлайны со ScrollTrigger) единым реактивным флагом `revealed`.
 *
 * Использование в шаблоне:
 *   const { revealed } = useSectionReveal('[ Проекты ]')
 *   <div class="reveal-item" :class="{ 'is-revealed': revealed }" style="--reveal-delay: 100ms">
 *
 * Тайминги/easing/сдвиг задаются глобально через CSS-переменные (см. app.vue),
 * каскад («лесенка») — через инлайновую --reveal-delay на каждом элементе.
 *
 * @param label Метка секции из массива sectionLabels (index.vue), напр. '[ Проекты ]'.
 * @param opts.enterDelay  Доп. задержка ПОЯВЛЕНИЯ в мс (исчезновение всегда мгновенное).
 *                         Нужна там, где контент должен дождаться внешнего процесса —
 *                         напр. трансформации органической сферы во вкладке «Прайс».
 * @param opts.fromActive  Отсчитывать появление от СТАРТА перехода (как только секция стала
 *                         активной), а не от прибытия скролла. Позволяет показать контент ещё
 *                         во время скролла — раньше, чем обычный последовательный тайминг.
 */
export function useSectionReveal(
  label: string,
  opts: { enterDelay?: number; fromActive?: boolean } = {}
) {
  const { activeLabel, arrivedLabel } = useSectionTransition()

  // По умолчанию — последовательно: активна И скролл уже прибыл.
  // fromActive — только активна (старт перехода), чтобы показать контент раньше прибытия.
  const base = computed(() =>
    opts.fromActive
      ? activeLabel.value === label
      : activeLabel.value === label && arrivedLabel.value === label
  )

  if (!opts.enterDelay) {
    return { revealed: base }
  }

  // Появление с дополнительной задержкой, исчезновение — мгновенно.
  const revealed = ref(base.value)
  let timer: ReturnType<typeof setTimeout> | null = null
  const clear = () => { if (timer) { clearTimeout(timer); timer = null } }

  watch(base, (val) => {
    clear()
    if (val) {
      timer = setTimeout(() => { revealed.value = true }, opts.enterDelay)
    } else {
      revealed.value = false
    }
  })

  onBeforeUnmount(clear)
  return { revealed }
}
