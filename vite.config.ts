import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.webmanifest',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'logo.png',
          'logo-circle.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-192x192.png',
          'pwa-maskable-512x512.png',
          'icon-192x192.png',
          'icon-512x512.png',
          'bg-himalayas.jpg',
        ],
        manifest: {
          id: '/',
          name: 'Nautiyal Cyber Cafe',
          short_name: 'Nautiyal Cafe',
          description: 'Nautiyal Cyber Cafe Online Services',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          display_override: ['standalone', 'window-controls-overlay', 'minimal-ui'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          lang: 'en-IN',
          dir: 'ltr',
          prefer_related_applications: false,
          categories: ['business', 'productivity', 'utilities'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Online Services',
              short_name: 'Services',
              description: 'Browse and apply for Nautiyal Cyber Cafe online services',
              url: '/#services',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'My Applications',
              short_name: 'Applications',
              description: 'Track your service applications and status',
              url: '/#applications',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'My Documents',
              short_name: 'Documents',
              description: 'Download completed official certificates and documents',
              url: '/#documents',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2,json,webmanifest}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : __dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
