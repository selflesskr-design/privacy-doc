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
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon-180.png'],
      manifest: {
        name: 'PrivacyDoc — 개인정보 안전 문서 도구',
        short_name: 'PrivacyDoc',
        description:
          'PDF·이미지 속 개인정보를 브라우저 안에서 안전하게 가립니다. 파일이 서버로 전송되지 않습니다.',
        lang: 'ko',
        theme_color: '#0b1018',
        background_color: '#0b1018',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
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
    // Split the heavy libraries so the initial load stays small.
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist'],
          pdflib: ['pdf-lib'],
          docx: ['docx', 'mammoth'],
        },
      },
    },
  },
})
