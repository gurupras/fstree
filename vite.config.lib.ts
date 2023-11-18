/// <reference types="vitest" />
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib.ts'),
      name: 'FSTree',
      fileName: 'fstree',
      formats: ['es', 'cjs', 'umd']
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  plugins: [
    vue(),
    Components({
      resolvers: [IconsResolver()]
    }),
    Icons()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      exclude: [
        'src/js/test-utils.ts'
      ]
    }
  }
})
