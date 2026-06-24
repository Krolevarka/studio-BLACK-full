/// <reference types="node" />
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxtjs/google-fonts', 'nuxt-security', '@nuxtjs/device'],
  googleFonts: {
    families: {
      'Wix+Madefor+Display': '400..800',
      'Wix+Madefor+Text': '400..800'
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  security: {
    nonce: process.env.NODE_ENV === 'production',
    headers: process.env.NODE_ENV === 'development' ? false : {
      contentSecurityPolicy: {
        'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
        'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        'font-src': ["'self'", "data:", "https://fonts.gstatic.com"],
        'img-src': ["'self'", "data:"]
      }
    }
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      meta: [
        { name: 'theme-color', content: '#000000' }
      ]
    }
  }
})