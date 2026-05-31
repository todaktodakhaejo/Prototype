import { useRef, useState } from 'react'
import { motion, useMotionValue, useVelocity, useSpring, useTransform } from 'framer-motion'
import { LONG_PRESS_MS } from '../constants'

interface Props {
  onLongPress?: () => void // 800ms 이상 누르고 있으면 발화 (글쓰기 진입)
  onPressStart?: () => void // 누르는 순간 발화 (멘트 사라짐 등)
  faint?: boolean
  size?: number
}

interface Ripple {
  id: number
  x: number
  y: number
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

// 유기적 블롭 모핑 키프레임 — 완벽한 원이 아니라 액체 덩어리처럼 천천히 출렁임
const BLOB_MORPH = [
  '46% 54% 56% 44% / 54% 46% 54% 46%',
  '54% 46% 47% 53% / 46% 55% 45% 54%',
  '50% 51% 53% 47% / 51% 49% 51% 49%',
  '46% 54% 56% 44% / 54% 46% 54% 46%',
]

// 감정의 매개체 — 중앙의 슬라임/젤리 덩어리.
// onLongPress가 있으면(=홈) 인터랙션 활성화. 마우스·터치 모두 Pointer 이벤트로 동시 지원.
//   누름   : 손가락 자리가 파고드는 딤플 + 비대칭 찌그러짐(압력 느낌)
//   드래그 : 이동 속도에 따라 진행 축으로 늘어남(반대쪽이 끈적하게 끌려옴), 원형 유지 안 함
//   떼기   : 스프링으로 탱글하게 원래 형태로 복원(약간의 탄성 오버슈트)
//   문지름 : 속도가 실시간 반영되어 표면이 흐르듯 출렁임
//   + 롱프레스 게이지(원형) / 터치 파장(ripple) 유지
export default function JellyBall({ onLongPress, onPressStart, faint = false, size = 150 }: Props) {
  const interactive = !!onLongPress
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [pressing, setPressing] = useState(false)
  const [pressPt, setPressPt] = useState({ x: size / 2, y: size / 2 })
  const rippleSeq = useRef(0)
  const timerRef = useRef<number | null>(null)

  // 드래그 위치 → 속도 → (부드럽게) 물성 변형
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const vx = useSpring(useVelocity(x), { stiffness: 200, damping: 22, mass: 0.6 })
  const vy = useSpring(useVelocity(y), { stiffness: 200, damping: 22, mass: 0.6 })

  // 이동 축으로 늘고 수직 축은 눌림 (질량 보존하는 액체처럼)
  const stretchX = useTransform([vx, vy], ([ax, ay]: number[]) =>
    1 + clamp((Math.abs(ax) - Math.abs(ay)) / 2600, -0.14, 0.26),
  )
  const stretchY = useTransform([vx, vy], ([ax, ay]: number[]) =>
    1 + clamp((Math.abs(ay) - Math.abs(ax)) / 2600, -0.14, 0.26),
  )
  // 끈적하게 끌려오는 기울임(트레일링)
  const skewX = useTransform(vx, [-2200, 0, 2200], [11, 0, -11])
  const skewY = useTransform(vy, [-2200, 0, 2200], [-9, 0, 9])

  // 누른 지점이 파고드는 방향(중심 기준 오프셋을 약하게)
  const dentX = (pressPt.x - size / 2) * 0.16
  const dentY = (pressPt.y - size / 2) * 0.16

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

  const endPress = () => {
    clearTimer()
    setPressing(false)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return

    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    // 터치 파장
    const id = rippleSeq.current++
    setRipples((prev) => [...prev, { id, x: px, y: py }])
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 700)

    // 누름 시작: 딤플 위치 기록 + 멘트 사라짐 + 게이지 + 800ms 후 진입
    setPressPt({ x: px, y: py })
    onPressStart?.()
    setPressing(true)
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      setPressing(false)
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
        x,
        y,
        cursor: interactive ? 'grab' : 'default',
        touchAction: 'none',
      }}
      drag={interactive}
      dragSnapToOrigin
      dragElastic={0.75}
      dragTransition={{ bounceStiffness: 200, bounceDamping: 12 }}
      onDragStart={endPress}
      whileDrag={interactive ? { cursor: 'grabbing' } : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
    >
      {/* 롱프레스 게이지 — 안정적으로 보이도록 변형 레이어 바깥(원형 유지) */}
      {pressing && (
        <svg
          width={ringSize}
          height={ringSize}
          style={{ position: 'absolute', left: ringOffset, top: ringOffset, transform: 'rotate(-90deg)', pointerEvents: 'none' }}
        >
          <circle cx={ringSize / 2} cy={ringSize / 2} r={ringR} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={4} />
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

      {/* 1) 속도 기반 늘어남/기울임 레이어 (드래그·문지름 물성) */}
      <motion.div style={{ width: '100%', height: '100%', scaleX: stretchX, scaleY: stretchY, skewX, skewY }}>
        {/* 2) 누름 찌그러짐 + 딤플 방향 이동 레이어 (스프링 복원) */}
        <motion.div
          style={{ width: '100%', height: '100%' }}
          animate={
            pressing
              ? { scaleX: 1.12, scaleY: 0.82, x: dentX, y: dentY }
              : { scaleX: 1, scaleY: 1, x: 0, y: 0 }
          }
          transition={{ type: 'spring', stiffness: 340, damping: 15 }}
        >
          {/* 3) 슬라임 본체 — 유기적 모핑 + 호흡 + 젤 같은 음영 */}
          <motion.div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background:
                'radial-gradient(circle at 36% 28%, rgba(255,255,255,0.95) 0%, var(--jelly-pink) 42%, #e08aa6 100%)',
              boxShadow:
                '0 16px 44px rgba(231,155,176,0.45), inset -10px -12px 26px rgba(193,96,128,0.4), inset 10px 12px 26px rgba(255,255,255,0.55)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: faint ? 0.25 : 0.9, borderRadius: BLOB_MORPH[0] }}
            animate={{
              opacity: faint ? 0.25 : 0.95,
              scale: [0.97, 1.0, 0.97],
              borderRadius: BLOB_MORPH,
            }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* 누른 자리 딤플 — 파고드는 음영 */}
            {pressing && (
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.85, scale: 1 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute',
                  left: pressPt.x,
                  top: pressPt.y,
                  width: size * 0.42,
                  height: size * 0.42,
                  marginLeft: -size * 0.21,
                  marginTop: -size * 0.21,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(150,70,95,0.45) 0%, rgba(150,70,95,0.12) 45%, rgba(150,70,95,0) 70%)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 터치 파장 */}
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
