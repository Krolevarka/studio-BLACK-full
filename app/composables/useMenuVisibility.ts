import { ref, onBeforeUnmount } from 'vue'
import { useEventBus } from '~/composables/useEventBus'

export function useMenuVisibility() {
  const isMenuOpenLocal = ref(false)
  const isMenuTransitioning = ref(false)
  let menuTimer: ReturnType<typeof setTimeout> | null = null
  
  const { on } = useEventBus()

  on('menu-state', (isOpen: boolean) => {
    isMenuOpenLocal.value = isOpen
    isMenuTransitioning.value = true
    if (menuTimer) clearTimeout(menuTimer)
    if (!isOpen) {
      menuTimer = setTimeout(() => {
        isMenuTransitioning.value = false
      }, 1500)
    }
  })

  onBeforeUnmount(() => {
    if (menuTimer) clearTimeout(menuTimer)
  })

  return {
    isMenuOpenLocal,
    isMenuTransitioning
  }
}
