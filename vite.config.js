import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PrivacyDoc is a 100% client-side static app. No dev/prod proxy, no external hosts.
// The service worker precaches every asset so the app runs fully offline.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache everything the app needs, including the pdf.js worker and wasm.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,wasm}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        // Never fall back to the network for navigations — offline-first.
        navigateFallback: 'index.html',
        // The Korean PDF font (2.6 MB) is deliberately NOT precached: most users
        // never add Korean text to a PDF. It is cached on first use instead, so
        // it costs nothing up front but still works offline afterwards.
        runtimeCaching: [
          {
            urlPattern: /\/fonts\/.*\.ttf$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'privacydoc-pdf-fonts',
              expiration: { maxEntries: 4 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon-180.png'],
      manifest: {
        name: 'PrivacyDoc — 개인정보 안전 문서 도구',
        short_name: 'PrivacyDoc',
        description:
          'PDF·이미지 속 개인정보를 브라우저 안에서 안전하게 가립니다. 파일이 서버로 전송되지 않습니다.',
        lang: 'ko',
        theme_color: '#FBF7F2',
        background_color: '#FBF7F2',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          // Separate file: Android crops maskable icons, so the symbol is inset.
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2020',
    // No manualChunks. Forcing pdf-lib into a named chunk made Rollup treat it
    // as a static dependency of the entry, so every landing page preloaded
    // ~200 KB of PDF code it never used. Letting Rollup split on the dynamic
    // import boundaries instead keeps the heavy libraries with the tools that
    // actually pull them in.
  },
})
