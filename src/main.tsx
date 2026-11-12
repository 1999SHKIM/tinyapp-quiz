import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// [참고] React 진입점
// - 하나의 루트에서 화면을 관리한다. 화면 전환은 이후 App의 상태로 처리한다.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
