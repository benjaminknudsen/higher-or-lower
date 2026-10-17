import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/higher-or-lower/',
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    injectRegister: false,
    scope: '/higher-or-lower/',
    includeAssets: ['favicon.svg', 'app-logo.png', 'icons/*.png', 'images/**/*.webp', 'images/card-grain.svg'],
    manifest: {
      id: '/higher-or-lower/',
      name: 'FCM Higher or Lower',
      short_name: 'FCM H/L',
      lang: 'da',
      description: 'Hvor godt kender du FCM? Test din viden om klubbens spillere.',
      start_url: '/higher-or-lower/',
      scope: '/higher-or-lower/',
      display: 'standalone',
      background_color: '#161625',
      theme_color: '#161625',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      cacheId: 'fcm-higher-or-lower',
      globPatterns: ['**/*.{js,css,html,svg,png,webp,woff,woff2,json}'],
      globIgnores: ['dev/**'],
      navigateFallback: '/higher-or-lower/index.html',
      navigateFallbackAllowlist: [/^\/higher-or-lower\/(?:index\.html)?$/],
      cleanupOutdatedCaches: true,
      // New versions wait until our registration code reaches the menu.
      skipWaiting: false,
      clientsClaim: true,
    },
  })],
})
