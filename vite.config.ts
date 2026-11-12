import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// [참고] 언어별 정적 빌드
// - 플랫폼의 게임 주소 아래에서도 파일을 찾도록 상대 경로를 쓴다.
// - 모드별 폴더로 출력하여 언어마다 독립된 앱으로 등록할 수 있게 한다.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  build: {
    outDir: `dist/${mode}`,
  },
}))
