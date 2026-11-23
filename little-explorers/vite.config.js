import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 相对 base：构建产物可以放在 GitHub Pages 的任意子路径下，
// 不依赖仓库名，也方便本地以 /little-explorers/ 目录直接静态预览。
export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
  },
})
