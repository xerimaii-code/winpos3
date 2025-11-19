import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 로컬 개발 시 /api 요청을 백엔드로 포워딩할 필요가 있을 경우 설정
    // (Vercel 배포 시에는 필요 없으나 로컬 테스트용으로 유용)
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 로컬 백엔드를 따로 띄울 경우
        changeOrigin: true,
      }
    }
  }
});