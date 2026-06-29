import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // In production (apk) we need relative paths, otherwise assets fail to load.
  base: mode === 'production' ? './' : '/sismodetectoreltecnicoluis/',
}))
