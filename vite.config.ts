import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // LAN(0.0.0.0)에 노출 — 같은 와이파이 폰에서 접속
    // 외부 공개 터널(cloudflared trycloudflare 등)에서 들어오는 호스트 허용.
    // dev 공유용이라 호스트 검사를 끔(프로덕션 빌드와 무관).
    allowedHosts: true,
  },
})
