import { useNuxtApp } from '#imports'

export function useNavigation() {
  const { $lenis } = useNuxtApp()
  
  const scrollToSection = (id: string) => {
    if ($lenis) {
      $lenis.scrollTo(id, {
        duration: 2.5,
        easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      })
    }
  }

  const scrollToContact = () => scrollToSection('#contact')

  return {
    scrollToSection,
    scrollToContact
  }
}
