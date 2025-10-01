import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'

// https://vitejs.dev/config/
export default defineConfig(async () => {
  let tailwindPlugin: any = null
  try {
    const mod = await import('@tailwindcss/vite')
    tailwindPlugin = mod.default()
  } catch (e) {
    console.warn('Tailwind plugin not loaded, continuing without it:', e)
  }

  return {
    plugins: [
      react(),
      ...(tailwindPlugin ? [tailwindPlugin] : []),
      electron([
        {
          entry: 'electron/main.ts',
          onstart() {
            // No-op: start Electron manually via `npm run electron:start`
          },
        },
        {
          entry: 'electron/preload.ts',
        },
      ]),
    ],
    server: {
      port: parseInt(process.env.FRONTEND_PORT || '5173'),
      host: '0.0.0.0',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
