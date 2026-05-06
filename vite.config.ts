import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Added comment to force clear Vite cache and restart dev server
export default defineConfig({
  plugins: [react()],
})
