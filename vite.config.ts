import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { offlineShell } from './build/offlineShell'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), offlineShell()],
})
