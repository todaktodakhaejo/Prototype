import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { unlockAudio } from './sfx'
import { initPostHog } from './posthog'
import { UID } from './analytics'
import './styles/tokens.css'
import './styles/global.css'

// PostHog 초기화(키 있을 때만). 익명 uid로 사용자 묶기.
initPostHog(UID)

// iOS 등: 첫 사용자 제스처에서 오디오 잠금 해제(이후 효과음 재생 가능). 매번 호출해도 가벼움(suspended일 때만 resume).
if (typeof window !== 'undefined') {
  const wake = () => unlockAudio()
  window.addEventListener('pointerdown', wake)
  window.addEventListener('touchend', wake)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
