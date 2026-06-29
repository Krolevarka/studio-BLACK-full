import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

declare global {
  interface Window {
    _preventInputScrollBypass?: (e: Event) => void
  }
}

export default defineNuxtPlugin((nuxtApp) => {

  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.config({ ignoreMobileResize: true })

  // Базовая чистая инициализация Lenis для плавно скроллящегося сайта
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: false, // Выключаем нативный плавный скролл, им управляет Observer
    syncTouch: false, // Выключаем синхронизацию тачпада/мобильного скролла
    wheelMultiplier: 1,
    touchMultiplier: 0, // Отключаем влияние тач-свайпов на сам Lenis
    infinite: false,
  })

  // Синхронизация Lenis и GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update)

  const rafCallback = (time: number) => {
    lenis.raf(time * 1000)
  }
  gsap.ticker.add(rafCallback)

  gsap.ticker.lagSmoothing(0)

  // Блокируем обход скролла (колесико мыши)
  const preventScrollBypass = (e: MouseEvent) => {
    if (e.type === 'mousedown' && e.button === 1) {
      e.preventDefault() // блокируем скролл колесиком
    }
  }

  // Блокируем свободный скролл с клавиатуры (пробел, стрелки, page up/down)
  const preventKeyboardScrollBypass = (e: KeyboardEvent) => {
    const arrowKeys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
    const scrollKeys = ['Space', 'PageDown', 'PageUp', 'Home', 'End'];

    if (arrowKeys.includes(e.code) || scrollKeys.includes(e.code)) {
      const target = e.target as HTMLElement;
      if (target) {
        const isTextInput = ['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable;
        const isSelect = target.tagName === 'SELECT';
        const isButton = target.tagName === 'BUTTON' || target.getAttribute('role') === 'button';

        // 1. В текстовых полях ввода разрешаем любые клавиши для перемещения курсора и ввода пробела
        if (isTextInput) return;

        // 2. В выпадающих списках (SELECT) разрешаем стрелки для выбора опций
        if (isSelect && arrowKeys.includes(e.code)) return;

        // 3. Для кнопок разрешаем только Пробел (чтобы активировать кнопку по a11y), а стрелки запрещаем
        if (isButton && e.code === 'Space') return;

        // Во всех остальных случаях (включая нажатие стрелок на кнопках или body) блокируем скролл
        e.preventDefault();
      }
    }
  }

  if (typeof window !== 'undefined') {
    document.body.style.overscrollBehavior = 'none' // убираем rubber-band эффект
    window.addEventListener('mousedown', preventScrollBypass)
    window.addEventListener('keydown', preventKeyboardScrollBypass)
    
    // Блокируем нативный скролл, если мы находимся над инпутом, текстареей или любым элементом из ignore-списка Observer
    const preventInputScrollBypass = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const ignoredEl = target.closest('input, select, textarea, .no-swipe, [data-lenis-prevent]');
      if (!ignoredEl) return;
      
      const tagName = ignoredEl.tagName;
      
      if (tagName === 'INPUT' || tagName === 'SELECT') {
        e.preventDefault();
      } else if (tagName === 'TEXTAREA') {
        const ta = ignoredEl as HTMLTextAreaElement;
        const canScrollUp = ta.scrollTop > 0;
        const canScrollDown = Math.round(ta.scrollTop + ta.clientHeight) < ta.scrollHeight;
        
        if (e.type === 'wheel') {
          const deltaY = (e as WheelEvent).deltaY;
          if (deltaY < 0 && !canScrollUp) e.preventDefault();
          else if (deltaY > 0 && !canScrollDown) e.preventDefault();
        } else if (e.type === 'touchmove') {
          // Если textarea не может скроллиться ни в одну из сторон, блокируем свайп
          if (!canScrollUp && !canScrollDown) {
            e.preventDefault();
          }
        }
      } else {
        // Для .no-swipe и [data-lenis-prevent] мы блокируем нативный скролл (wheel, touchmove).
        e.preventDefault();
      }
    };
    
    window.addEventListener('wheel', preventInputScrollBypass, { passive: false })
    window.addEventListener('touchmove', preventInputScrollBypass, { passive: false })
    
    // Сохраняем в объект window, чтобы можно было удалить в cleanup
    window._preventInputScrollBypass = preventInputScrollBypass;
  }

  const cleanup = () => {
    gsap.ticker.remove(rafCallback)
    lenis.destroy()
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousedown', preventScrollBypass)
      window.removeEventListener('keydown', preventKeyboardScrollBypass)
      window.removeEventListener('beforeunload', cleanup)
      if (window._preventInputScrollBypass) {
        window.removeEventListener('wheel', window._preventInputScrollBypass)
        window.removeEventListener('touchmove', window._preventInputScrollBypass)
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)
  }

  if (import.meta.hot) {
    import.meta.hot.dispose(cleanup)
  }

  return {
    provide: {
      lenis
    }
  }
})
