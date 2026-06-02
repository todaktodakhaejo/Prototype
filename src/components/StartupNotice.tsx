import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// 시작 시 오른쪽 하단에서 잔잔하게 나오는 이용 환경 안내 말풍선.
//  잠시 보였다가 스스로 사라지고, × 로 바로 닫을 수도 있다. (앱 로드당 1회)
//  말랑이의 촉감(진동/햅틱) 안내 + 직접 확인 버튼 포함 — 무음·절전 모드면 진동이 꺼질 수 있어 미리 점검.
export default function StartupNotice() {
  const [show, setShow] = useState(true)
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

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 20000) // 잔잔히 머물다 자동으로 사라짐(진동 점검 여유)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 50,
            maxWidth: 300,
            padding: '14px 30px 14px 16px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.93)',
            color: 'var(--ink)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            fontFamily: 'var(--batang)',
            fontSize: 13,
            lineHeight: 1.7,
            textAlign: 'left',
          }}
        >
          <button
            onClick={() => setShow(false)}
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
          <p style={{ fontWeight: 700, marginBottom: 6 }}>📱 이용 환경 안내</p>
          <p>
            크롬·사파리·삼성인터넷 최신 버전을 권장합니다. iOS는 15.4 이상에서 가장 잘 보입니다. 카카오톡
            등 앱 안의 브라우저보다 기본 브라우저로, 가능하면 휴대폰으로 열어 주시기 바랍니다.
          </p>
          <p style={{ marginTop: 10, fontWeight: 700 }}>📳 진동(햅틱) 안내</p>
          <p>
            말랑이를 만지면 가벼운 진동으로 촉감을 전해요. <b>무음·방해금지·절전 모드</b>에서는 진동이
            꺼질 수 있으니, 시작 전 진동을 켜고 아래로 확인해 보세요.
          </p>
          <button
            onClick={testVibe}
            style={{
              marginTop: 8,
              padding: '7px 14px',
              borderRadius: 999,
              border: 'none',
              background: 'var(--jelly-pink, #f4b8c7)',
              color: '#5a2238',
              fontFamily: 'var(--batang)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔔 진동 느껴보기
          </button>
          {vibeMsg && (
            <p style={{ marginTop: 7, fontSize: 12, color: 'var(--ink-mute)' }}>{vibeMsg}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
