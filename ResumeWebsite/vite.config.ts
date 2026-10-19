import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        ogl: path.resolve(__dirname, 'src/lib/ogl.ts')
      }
    },
    define: {
      // Expose the API key to the app code
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  }
})
