declare module '#app' {
  interface NuxtApp {
    $lenis: {
      scrollTo: (target: string | number | HTMLElement, options?: Record<string, unknown>) => void;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      off: (event: string, callback: (...args: unknown[]) => void) => void;
      start: () => void;
      stop: () => void;
      destroy: () => void;
      isStopped: boolean;
    } | undefined;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $lenis: import('#app').NuxtApp['$lenis'];
  }
}

export {}
