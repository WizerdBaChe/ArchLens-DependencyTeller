import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ArchLens-DependencyTeller/' : '/',
  plugins: [
    react(),
    ...(command === 'serve' ? [basicSsl()] : []),
  ],
}))
