import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Permite que el contenedor de capturas (Playwright) abra el sitio en desarrollo para revisarlo
    allowedHosts: ['host.docker.internal'],
    // En desarrollo la API corre aparte (dotnet run). Así el navegador ve un solo origen, igual que con Caddy en producción
    proxy: {
      '/api': { target: 'http://localhost:5055', changeOrigin: false }
    }
  }
})
