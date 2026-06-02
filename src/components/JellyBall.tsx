import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useVelocity, useSpring, useTransform } from 'framer-motion'
import { LONG_PRESS_MS } from '../constants'
import { hapticPress, hapticRelease, hapticRubTick, hapticWallHit, stopVibration } from '../haptics'

// 문지름 햅틱: 이동 누적거리 이만큼마다 1펄스 (작을수록 촘촘 = 빠를수록 빈도↑)
const RUB_STEP_PX = 14
// 벽 충돌 강도 정규화 기준 속도(px/s) — 이 속도면 강도 1(최대 진동 길이)
const WALL_VMAX = 2600
// 충돌 래치 해제 여백(px) — 경계 안으로 이만큼 들어와야 다음 충돌을 다시 인식
const WALL_RESET_MARGIN = 10

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
//   + KPI: 누름(드래그 포함) 활성 시간 계측(onPlayActive) — idle 제외
export default function JellyBall({ onLongPress, onPressStart, onPlayActive, faint = false, size = 150 }: Props) {
  const interactive = !!onLongPress
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [pressing, setPressing] = useState(false)
  const [pressPt, setPressPt] = useState({ x: size / 2, y: size / 2 })
  const rippleSeq = useRef(0)
  const timerRef = useRef<number | null>(null)

  // 햅틱: 포인터가 눌려 있는지 / 충돌 경계(드래그 오프셋 한계) / 충돌 래치
  const isDownRef = useRef(false)
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null)
  const hitXRef = useRef(false)
  const hitYRef = useRef(false)

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

  // 누름 도중 화면이 바뀌어 언마운트되면(롱프레스로 글쓰기 진입 등) 남은 구간 회수 + 진동 정리
  useEffect(() => {
    return () => {
      if (activeStartRef.current !== null) {
        const ms = Date.now() - activeStartRef.current
        activeStartRef.current = null
        if (ms > 0) onPlayActiveRef.current?.(ms)
      }
      stopVibration()
    }
  }, [])

  // 햅틱: 드래그 오프셋(x/y) 변화를 구독해 (3)문지름 + (1)벽 충돌을 발화.
  //   문지름 — 누른 채 이동한 누적거리 RUB_STEP_PX마다 약한 펄스(빠를수록 빈도↑).
  //   벽 충돌 — 오프셋이 경계를 넘는 순간 1회, 그때의 속도로 강도 차등. 안으로 복귀하면 래치 해제.
  useEffect(() => {
    if (!interactive) return
    let lx = x.get()
    let ly = y.get()
    let rubAcc = 0

    const onChange = () => {
      const cx = x.get()
      const cy = y.get()

      // (3) 문지름 — 누르고 있는 동안 이동할 때만
      if (isDownRef.current) {
        rubAcc += Math.hypot(cx - lx, cy - ly)
        if (rubAcc >= RUB_STEP_PX) {
          rubAcc = 0
          hapticRubTick()
        }
      }
      lx = cx
      ly = cy

      // (1) 벽 충돌 — 측정된 경계 밖으로 나가는 순간만(래치)
      const b = boundsRef.current
      if (!b) return

      if (cx <= b.minX || cx >= b.maxX) {
        if (!hitXRef.current) {
          hitXRef.current = true
          hapticWallHit(Math.abs(vx.get()) / WALL_VMAX)
        }
      } else if (cx > b.minX + WALL_RESET_MARGIN && cx < b.maxX - WALL_RESET_MARGIN) {
        hitXRef.current = false
      }

      if (cy <= b.minY || cy >= b.maxY) {
        if (!hitYRef.current) {
          hitYRef.current = true
          hapticWallHit(Math.abs(vy.get()) / WALL_VMAX)
        }
      } else if (cy > b.minY + WALL_RESET_MARGIN && cy < b.maxY - WALL_RESET_MARGIN) {
        hitYRef.current = false
      }
    }

    const ux = x.on('change', onChange)
    const uy = y.on('change', onChange)
    return () => {
      ux()
      uy()
    }
  }, [interactive, x, y, vx, vy])

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

  const endPress = () => {
    clearTimer()
    setPressing(false)
  }

  // 누름 해제(떼기/취소/이탈) — 활성 구간 마감 후 게이지 리셋 + (2b)해제 햅틱
  const endPressAndActive = () => {
    if (isDownRef.current) {
      isDownRef.current = false
      hapticRelease() // "삐-용" — 누름과 구분되는 두 박자
    }
    closeActive()
    endPress()
  }

  // 드래그 오프셋(x/y)이 프레임 경계에 닿는 한계치를 현재 위치 기준으로 측정.
  // (왼/오른/위/아래 가장자리에 공의 해당 변이 닿는 지점을 오프셋 좌표로 환산)
  const measureBounds = (el: HTMLElement) => {
    const ball = el.getBoundingClientRect()
    const frame = (el.closest('.app-frame') ?? el.parentElement)?.getBoundingClientRect()
    if (!frame) {
      boundsRef.current = null
      return
    }
    const x0 = x.get()
    const y0 = y.get()
    boundsRef.current = {
      minX: x0 - (ball.left - frame.left),
      maxX: x0 + (frame.right - ball.right),
      minY: y0 - (ball.top - frame.top),
      maxY: y0 + (frame.bottom - ball.bottom),
    }
    hitXRef.current = false
    hitYRef.current = false
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return

    // 공놀이 활성 구간 시작
    activeStartRef.current = Date.now()

    // 햅틱: 누름 시작 + 충돌 경계 측정 + (2a)누름 햅틱
    isDownRef.current = true
    measureBounds(e.currentTarget)
    hapticPress() // 매우 짧은 톡

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
        x,
        y,
        cursor: interactive ? 'grab' : 'default',
        touchAction: 'none',
      }}
      drag={interactive}
      dragSnapToOrigin
      dragElastic={0.75}
      dragTransition={{ bounceStiffness: 200, bounceDamping: 12 }}
      onDragStart={endPress} // 드래그로 판정되면 롱프레스(게이지)만 취소 — 활성 시간은 계속 누적
      whileDrag={interactive ? { cursor: 'grabbing' } : undefined}
      onPointerDown={handlePointerDown}
      onPointerUp={endPressAndActive}
      onPointerCancel={endPressAndActive}
      onPointerLeave={endPressAndActive}
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
