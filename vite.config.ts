import { defineConfig, loadEnv } from 'vite'

import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  
  return {
    plugins: [react()],
    define: {
      'process.env': env
    }
  }
})