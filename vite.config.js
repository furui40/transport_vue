import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // 代理 API 请求
      '/web': {
        target: 'http://localhost:8080', // 后端服务器地址
        changeOrigin: true, // 如果接口跨域，需要进行这个参数配置
        secure: false, // 如果是https接口，需要配置这个参数
        rewrite: (path) => path.replace(/^\/web/, ''), // 去掉路径中的 /web
      },
    },
  },
})
