import gsap from 'gsap'
import { useEventBus } from '~/composables/useEventBus'
import { useOrganicState } from './useOrganicState'

export function usePreloader() {
  const s = useOrganicState()
  const { emit } = useEventBus()

  const startPreloaderAnimation = () => {
    s.isPreloading.value = true
    s.stateConfig.preloaderProgress = 0
    s.stateConfig.fillProgress = 0.95 // Начинаем с вырезанной дырки 95% (очень тонкое кольцо 5% толщины)

    const tl = gsap.timeline({
      onComplete: () => {
        s.isPreloading.value = false
        emit('finish-preloader')
      }
    })

    // Этап 1: Рисуем контур по кругу (раскрываем клип)
    tl.to(s.stateConfig, {
      preloaderProgress: 1,
      duration: 2.5,
      ease: 'power2.inOut'
    })
    
    // Этап 2: Дырка сжимается до 0, заполняя сферу изнутри
    tl.to(s.stateConfig, {
      fillProgress: 0,
      duration: 1.0,
      ease: 'power2.inOut'
    })

    return tl
  }

  return {
    startPreloaderAnimation
  }
}
