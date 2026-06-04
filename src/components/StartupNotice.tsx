import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'

// 중앙 하단에서 잔잔하게 나오는 이용 환경 안내 말풍선.
//  '시작 화면'(매 라운드 시작 기분질문 MOOD_PRE)에서만 보인다 → 온보딩 등 다른 화면의 버튼과 겹칠 일이 없음.
//  말풍선의 실제 높이를 CSS 변수(--notice-h)로 노출 → MoodScale이 그만큼 하단 여백을 확보해 [확인] 버튼과 절대 안 겹침.
export default function StartupNotice() {
  const step = useStore((s) => s.step)
  const [dismissed, setDismissed] = useState(false)
  const onStart = step === 'MOOD_PRE' // 시작 화면(매 라운드)에서만 노출
  useEffect(() => {
    if (!onStart) setDismissed(false) // 시작 화면을 벗어나면 닫힘 리셋 → 다음 라운드 다시 표시
  }, [onStart])
  const show = onStart && !dismissed

  const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  const [vibeMsg, setVibeMsg] = useState('')

  // 말풍선 높이를 측정해 --notice-h로 노출(보이면 실제 높이, 숨으면 0) → 본문이 그만큼 비켜남
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const root = document.documentElement
    if (show && ref.current) root.style.setProperty('--notice-h', `${ref.current.offsetHeight}px`)
    else root.style.setProperty('--notice-h', '0px')
    return () => root.style.setProperty('--notice-h', '0px')
  }, [show, vibeMsg])

  const testVibe = () => {
    if (!canVibrate) {
      setVibeMsg('이 브라우저는 진동을 지원하지 않아요. (아이폰 전체 · 사파리 · 파이어폭스)')
      return
    }
    try {
      navigator.vibrate([60, 50, 120, 50, 200])
    } catch {
      /* 무시 */
    }
    setVibeMsg('안 느껴지면 무음·방해금지·절전 모드를 꺼 주세요.')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={ref}
          // 중앙 하단 배치 — 가운데 정렬은 x:'-50%'로(애니메이션이 transform을 덮지 않게)
          initial={{ opacity: 0, x: '-50%', y: 14 }}
          animate={{ opacity: 1, x: '-50%', y: 0, transition: { duration: 0.7, delay: 0.8, ease: 'easeOut' } }}
          exit={{ opacity: 0, x: '-50%', transition: { duration: 0.12 } }}
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 12,
            zIndex: 50,
            // 가로로 넓혀 줄바꿈을 줄임 → 세로 높이가 짧아져 시작 질문이 덜 위로 치우침
            width: 'min(95vw, 416px)',
            maxHeight: '40vh',
            overflowY: 'auto',
            padding: '10px 26px 11px 14px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.95)',
            color: 'var(--ink)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            fontFamily: 'var(--batang)',
            fontSize: 11,
            lineHeight: 1.38,
            textAlign: 'left',
          }}
        >
          <button
            onClick={() => setDismissed(true)}
            aria-label="닫기"
            style={{ position: 'absolute', top: 6, right: 9, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-mute)', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>

          <p style={{ fontWeight: 700, marginBottom: 3 }}>📳 진동(햅틱) 안내</p>
          <p>
            <b>무음 · 방해금지 · 절전 모드를 꺼 주세요.</b>
          </p>
          <p style={{ marginTop: 4 }}>
            ✅ <b>안드로이드</b> 크롬 · 삼성인터넷 · 엣지에서만 진동이 느껴져요.
          </p>
          <p style={{ marginTop: 4, color: '#c0246a' }}>
            <b>⚠️ 아이폰은 크롬을 써도 안 돼요. 사파리 · 파이어폭스 · 카톡 등 인앱 브라우저도 미지원.</b>
          </p>

          <button
            onClick={testVibe}
            style={{ marginTop: 7, padding: '4px 11px', borderRadius: 999, border: 'none', background: 'var(--jelly-pink, #f4b8c7)', color: '#5a2238', fontFamily: 'var(--batang)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            🔔 진동 느껴보기
          </button>
          {vibeMsg && <p style={{ marginTop: 5, fontSize: 10.5, color: 'var(--ink-mute)' }}>{vibeMsg}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
