import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Basado en la guia de Next 16 (testing/vitest.md). En lugar del plugin
// vite-tsconfig-paths se usa la opcion nativa de Vite 8 para resolver los
// alias de tsconfig (@/*); el propio Vite marca el plugin como innecesario.
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
  },
})
