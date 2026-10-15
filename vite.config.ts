import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Two builds:
//  - default: installable PWA (GitHub Pages) -> dist/web
//  - "single": one self-contained HTML file for double-click offline use -> dist/single
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [
      preact(),
      single
        ? viteSingleFile({ removeViteModuleLoader: true })
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon-32.png', 'icon-180.png', 'icon.svg'],
            manifest: {
              name: 'PQP Maker',
              short_name: 'PQP Maker',
              description: 'Project Quality Plan generator',
              start_url: './',
              scope: './',
              display: 'standalone',
              background_color: '#E9EDF2',
              theme_color: '#002060',
              icons: [
                { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: { maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, globPatterns: ['**/*.{js,css,html,png,svg,jpg,json}'] },
          }),
    ],
    build: {
      outDir: single ? 'dist/single' : 'dist/web',
      emptyOutDir: true,
      assetsInlineLimit: single ? 100000000 : 4096,
      chunkSizeWarningLimit: 6000,
      ...(single ? { copyPublicDir: false } : {}),
    },
  };
});
