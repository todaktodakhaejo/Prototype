import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'

// 시작 시 오른쪽 하단에서 잔잔하게 나오는 이용 환경 안내 말풍선.
//  '시작화면'(앱을 열었을 때의 첫 화면)에서만 보이고, 다음 화면으로 넘어가면 사라진다. × 로 바로 닫을 수도 있다.
//  말랑이의 촉감(진동/햅틱) 안내 + 직접 확인 버튼 포함 — 무음·절전 모드면 진동이 꺼질 수 있어 미리 점검.
export default function StartupNotice() {
  const step = useStore((s) => s.step)
  const [initialStep] = useState(step) // 앱을 열었을 때의 첫 화면(시작화면)
  const [dismissed, setDismissed] = useState(false)
  const show = !dismissed && step === initialStep // 시작화면을 벗어나면 자동으로 사라짐
  const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  const [vibeMsg, setVibeMsg] = useState('')

  const testVibe = () => {
    if (!canVibrate) {
      setVibeMsg('이 기기·브라우저는 진동을 지원하지 않아요(아이폰 등).')
      return
    }
    try {
      navigator.vibrate([60, 50, 120, 50, 200])
    } catch {
      /* 무시 */
    }
    setVibeMsg('진동이 안 느껴지면 무음·방해금지·절전 모드를 꺼 주세요.')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          // 중앙 하단 배치 — 가운데 정렬은 x:'-50%'로(애니메이션이 transform을 덮지 않게)
          initial={{ opacity: 0, x: '-50%', y: 14 }}
          animate={{ opacity: 1, x: '-50%', y: 0, transition: { duration: 0.7, delay: 0.8, ease: 'easeOut' } }}
          exit={{ opacity: 0, x: '-50%', transition: { duration: 0.12 } }} // 시작화면을 벗어나면 즉시 사라짐
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 14,
            zIndex: 50,
            maxWidth: 232,
            padding: '11px 24px 11px 13px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.93)',
            color: 'var(--ink)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            fontFamily: 'var(--batang)',
            fontSize: 11.5,
            lineHeight: 1.45,
            textAlign: 'left',
          }}
        >
          <button
            onClick={() => setDismissed(true)}
            aria-label="닫기"
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--ink-mute)',
              fontSize: 17,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <p style={{ fontWeight: 700, marginBottom: 3 }}>📱 이용 환경</p>
          <p>크롬·사파리·삼성인터넷 최신 버전, 가능하면 휴대폰 기본 브라우저로 열어 주세요. (iOS 15.4+)</p>
          <p style={{ marginTop: 7, fontWeight: 700 }}>📳 진동(햅틱)</p>
          <p>
            말랑이를 만지면 가벼운 진동이 나요. <b>무음·절전 모드</b>면 꺼질 수 있어요.
          </p>
          <button
            onClick={testVibe}
            style={{
              marginTop: 7,
              padding: '5px 12px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--jelly-pink, #f4b8c7)',
              color: '#5a2238',
              fontFamily: 'var(--batang)',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔔 진동 느껴보기
          </button>
          {vibeMsg && (
            <p style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-mute)' }}>{vibeMsg}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
