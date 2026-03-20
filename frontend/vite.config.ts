import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 1. Позволяет Docker пробрасывать порты (Vite слушает не только внутри сети контейнера)
    host: '0.0.0.0', 
    port: 5173,
    // 2. Важно: разрешаем Vite принимать запросы с вашего домена ngrok
    allowedHosts: [
      'heartenedly-uncommutable-eda.ngrok-free.dev'
    ],
    // 3. Настройка для Hot Module Replacement (чтобы правки в коде сразу отражались в браузере)
    hmr: {
      host: 'heartenedly-uncommutable-eda.ngrok-free.dev',
      clientPort: 443,
      protocol: 'wss'
    }
  }
})