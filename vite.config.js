import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFile } from "wpsjs/vite_plugins"
import mkcert from 'vite-plugin-mkcert' // Added import

// https://vitejs.dev/config/
export default defineConfig({
  base:'./',
  plugins: [
    mkcert(), // Added plugin
    copyFile({
      src: 'manifest.xml', // This should be manifest-wps.xml or similar if we have a separate one for office
      dest: 'manifest.xml', // Or manifest-wps.xml
    }),
    copyFile({ // This plugin will copy manifest-office.xml to the dist folder
      src: 'manifest-office.xml',
      dest: 'manifest-office.xml',
    }),
    copyFile({
      src: 'ribbon/ribbon.xml',
      dest: 'ribbon.xml',
    }),
    vue()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: { // Added build options
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)), // default Vue app entry
        'office-integration': fileURLToPath(new URL('./src/components/js/office-integration.js', import.meta.url))
      },
      output: {
        // Ensure the output name for office-integration is predictable if needed
        // For now, let Vite handle naming, and we'll inspect the dist folder.
        // If names are hashed, we'll need a strategy to update functionfile.html
        entryFileNames: assetInfo => {
          if (assetInfo.name === 'office-integration') {
            return 'assets/office-integration.js'; // Force a non-hashed name
          }
          return 'assets/[name]-[hash].js'; // Default for other entries
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  server: {
    host: '0.0.0.0', // Keep 0.0.0.0 to be accessible externally if needed
    port: 3889,
    https: true // Enabled HTTPS
  }
}) 