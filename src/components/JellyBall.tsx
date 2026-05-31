import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LONG_PRESS_MS } from '../constants'

interface Props {
  onLongPress?: () => void // 800ms 이상 누르고 있으면 발화 (글쓰기 진입)
  onPressStart?: () => void // 누르는 순간 발화 (멘트 사라짐 등)
  onPlayActive?: (ms: number) => void // 공놀이 활성 구간 1회분(ms) — 누름 해제마다 (KPI 계측)
  faint?: boolean
  size?: number
}

interface Ripple {
  id: number
  x: number
  y: number
}

// 감정의 매개체 — 중앙 젤리 공 오브제.
// onLongPress가 있으면(=홈) 제스처 인터랙션 활성화. 마우스·터치 모두 Pointer 이벤트로 동시 지원.
//   롱프레스           : 움직임 없이 LONG_PRESS_MS 이상 누르면 onLongPress (원형 게이지 + 눌림 효과)
//   GST-04 굴리기      : 드래그하면 포인터를 따라 이동 (드래그 시작 시 롱프레스 취소)
//   GST-02 당겼다 놓기 : 당기면 탄성 저항 → 놓으면 dragSnapToOrigin으로 원위치 복귀
//   GST-01 튕기기      : 빠르게 놓으면 release 속도가 스프링에 실려 더 크게 튕김
//   GST-03 터치 파장   : 누른 지점에서 동심원 ripple 확산
export default function JellyBall({ onLongPress, onPressStart, onPlayActive, faint = false, size = 150 }: Props) {
  const interactive = !!onLongPress
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [pressing, setPressing] = useState(false)
  const rippleSeq = useRef(0)
  const timerRef = useRef<number | null>(null)

  // 공놀이 활성 시간 계측: 누름(드래그 포함) 시작~해제 구간만 누적. idle은 제외.
  const activeStartRef = useRef<number | null>(null)
  const onPlayActiveRef = useRef(onPlayActive)
  onPlayActiveRef.current = onPlayActive

  const closeActive = () => {
    if (activeStartRef.current !== null) {
      const ms = Date.now() - activeStartRef.current
      activeStartRef.current = null
      if (ms > 0) onPlayActiveRef.current?.(ms)
    }
  }

  // 누름 도중 화면이 바뀌어 언마운트되면(롱프레스로 글쓰기 진입 등) 남은 구간 회수
  useEffect(() => {
    return () => {
      if (activeStartRef.current !== null) {
        const ms = Date.now() - activeStartRef.current
        activeStartRef.current = null
        if (ms > 0) onPlayActiveRef.current?.(ms)
      }
    }
  }, [])

  // 원형 게이지 기하
  const ringSize = size + 20
  const ringR = (size + 8) / 2
  const ringC = 2 * Math.PI * ringR
  const ringOffset = (size - ringSize) / 2

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // 누르기 종료(떼기/취소/드래그 시작) → 타이머·게이지 리셋, 원상복귀
  const endPress = () => {
    clearTimer()
    setPressing(false)
  }

  // 누름 해제(떼기/취소/이탈) — 활성 구간 마감 후 게이지 리셋
  const endPressAndActive = () => {
    closeActive()
    endPress()
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return

    // 공놀이 활성 구간 시작
    activeStartRef.current = Date.now()

    // GST-03: 누른 지점 기준 파장
    const rect = e.currentTarget.getBoundingClientRect()
    const id = rippleSeq.current++
    const ripple: Ripple = { id, x: e.clientX - rect.left, y: e.clientY - rect.top }
    setRipples((prev) => [...prev, ripple])
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 700)

    // 롱프레스 시작: 멘트 사라짐 + 게이지 차오름 + 800ms 후 진입
    onPressStart?.()
    setPressing(true)
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setPressing(false)
      closeActive() // 진입 직전까지의 누름 시간 회수
      onLongPress?.()
    }, LONG_PRESS_MS)
  }

  return (
    <motion.div
      aria-label="공 오브제"
      role={interactive ? 'button' : undefined}
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: interactive ? 'grab' : 'default',
        touchAction: 'none', // 터치 드래그 시 스크롤/제스처 가로채임 방지
      }}
      // GST 제스처: 드래그(굴리기) + 탄성 복귀(당겼다 놓기 / 튕기기)
      drag={interactive}
      dragSnapToOrigin
      dragElastic={0.7}
      dragTransition={{ bounceStiffness: 220, bounceDamping: 14 }}
      onDragStart={endPress} // 드래그로 판정되면 롱프레스(게이지)만 취소 — 활성 시간은 계속 누적
      whileDrag={interactive ? { cursor: 'grabbing', scale: 1.06 } : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={endPressAndActive}
      onPointerCancel={endPressAndActive}
      onPointerLeave={endPressAndActive}
    >
      {/* 롱프레스 게이지 — 누르는 동안만 등장, 800ms에 걸쳐 채워짐 */}
      {pressing && (
        <svg
          width={ringSize}
          height={ringSize}
          style={{
            position: 'absolute',
            left: ringOffset,
            top: ringOffset,
            transform: 'rotate(-90deg)', // 12시 방향에서 시작
            pointerEvents: 'none',
          }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringR}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={4}
          />
          <motion.circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={ringR}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={ringC}
            initial={{ strokeDashoffset: ringC }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: LONG_PRESS_MS / 1000, ease: 'linear' }}
          />
        </svg>
      )}

      {/* 눌림 효과 레이어 — 누르는 동안 살짝 작아짐 */}
      <motion.div
        animate={{ scale: pressing ? 0.9 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* 시각 본체 + idle 호흡 (드래그/눌림 transform과 충돌하지 않도록 내부 레이어) */}
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 30%, #ffffff 0%, var(--jelly-pink) 45%, #e79bb0 100%)',
            boxShadow: '0 12px 40px rgba(231, 155, 176, 0.45)',
            pointerEvents: 'none',
          }}
          initial={{ opacity: faint ? 0.25 : 0.9, scale: 0.96 }}
          animate={{ opacity: faint ? 0.25 : 0.95, scale: [0.96, 1.0, 0.96] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* GST-03 파장 — 누른 지점에서 동심원 확산 */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          initial={{ opacity: 0.5, scale: 0 }}
          animate={{ opacity: 0, scale: 4 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: 44,
            height: 44,
            marginLeft: -22,
            marginTop: -22,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.75)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </motion.div>
  )
}
