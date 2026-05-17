import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        id: '/',
        name: 'Bill App',
        short_name: 'Bill App',
        description: 'Offline-first mobile bill app',
        lang: 'en-IN',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        categories: ['finance', 'productivity', 'utilities'],
        prefer_related_applications: false,
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/splash/splash-540x960.png',
            sizes: '540x960',
            type: 'image/png',
            form_factor: 'narrow'
          }
        ],
        shortcuts: [
          {
            name: 'Calculator',
            short_name: 'Calculator',
            url: '/#calculator',
            icons: [
              {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'History',
            short_name: 'History',
            url: '/#history',
            icons: [
              {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              }
            ]
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-assets',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60
              }
            }
          },
          {
            urlPattern: /\.(?:woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-assets',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
