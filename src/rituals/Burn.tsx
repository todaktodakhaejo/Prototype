import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import Gauge from './Gauge'
import { rotatingMessage, BURN_MESSAGES } from '../constants'
import { hapticBurnTick, stopVibration } from '../haptics'

// 타오르는 진동 간격: 아래(느림)→위(잦음). 진행도 0→1에서 이 사이로 좁혀진다.
const BURN_GAP_SLOW_MS = 300 // 막 붙었을 때(아래) — 드문드문
const BURN_GAP_FAST_MS = 70 // 다 타갈 때(위) — 다다닥

const HOLD_SEC = 3.2 // 불붙은 뒤 다 타는 데 걸리는 시간
const HOLD_MSG = 2.6 // 잿더미 + 멘트 머무는 여운
// 성냥 머리가 종이(컨테이너 0..220 × 0..300) 안에 들어오면 점화.
//  성냥 머리의 '정지 시' 컨테이너 좌표(아래 배치 기준) — 여기에 드래그 오프셋을 더해 현재 위치를 계산.
const HEAD_REST_X = -33 // 종이 왼쪽 바깥
const HEAD_REST_Y = 215
const PAPER_W = 220
const PAPER_H = 300
// 불꽃 혀 — 폭/높이/속도/지연을 달리해 사실적으로 일렁이게 (가운데가 가장 높음)
const FLAMES = [
  { dx: -40, w: 22, h: 52, flick: 0.5, delay: 0 },
  { dx: -24, w: 30, h: 82, flick: 0.44, delay: 0.13 },
  { dx: -7, w: 36, h: 110, flick: 0.58, delay: 0.05 },
  { dx: 11, w: 32, h: 94, flick: 0.48, delay: 0.2 },
  { dx: 27, w: 26, h: 68, flick: 0.52, delay: 0.1 },
  { dx: 41, w: 18, h: 46, flick: 0.46, delay: 0.16 },
]
const EMBERS = Array.from({ length: 12 }, (_, i) => i)

// 태우기 — 먼저 '성냥을 끌어' 종이에 불을 붙이면(점화), 그때부터 아래에서 위로 타오른다.
//  점화 후엔 진행도(progress)가 시간에 따라 0→1로 차오르고, 게이지가 그와 동시에 찬다.
export default function Burn({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('burn', BURN_MESSAGES))
  const [lit, setLit] = useState(false) // 불 붙음(성냥으로 점화)
  const [pressing, setPressing] = useState(false) // 점화 후 꾹 누르는 동안만 타오름
  const [progress, setProgress] = useState(0) // 0~1 (아래에서부터 탄 정도)
  const [done, setDone] = useState(false)
  const last = useRef(0)
  const fired = useRef(false)
  const litRef = useRef(false)
  const progressRef = useRef(0) // 햅틱 인터벌에서 최신 진행도 읽기용
  progressRef.current = progress

  const ignite = () => {
    if (!litRef.current) {
      litRef.current = true
      setLit(true)
    }
  }
  // 성냥 머리가 종이 영역 안으로 들어왔을 때만 점화(그 전엔 자유롭게 움직일 수 있음)
  const onMatchDrag = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const hx = HEAD_REST_X + info.offset.x
    const hy = HEAD_REST_Y + info.offset.y
    if (hx >= 0 && hx <= PAPER_W && hy >= 0 && hy <= PAPER_H) ignite()
  }

  // 점화된 뒤 '꾹 누르고 있는 동안만' 타오름 (떼면 멈춤, 다시 누르면 이어서)
  useEffect(() => {
    if (!lit || !pressing || done) return
    let id = 0
    const tick = (t: number) => {
      if (!last.current) last.current = t
      const dt = (t - last.current) / 1000
      last.current = t
      setProgress((p) => Math.min(1, p + dt / HOLD_SEC))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(id)
      last.current = 0
    }
  }, [lit, pressing, done])

  // 타오르는 동안: 위로 갈수록 진동 '빈도'가 잦아짐(간격이 짧아짐). 세기는 일정.
  //   self-scheduling 타이머 — 매 펄스 직후 현재 진행도로 다음 간격을 다시 계산.
  useEffect(() => {
    if (!lit || !pressing || done) return
    let id = 0
    let alive = true
    const loop = () => {
      if (!alive) return
      const p = Math.max(0, Math.min(1, progressRef.current))
      hapticBurnTick()
      const gap = Math.round(BURN_GAP_SLOW_MS - p * (BURN_GAP_SLOW_MS - BURN_GAP_FAST_MS))
      id = window.setTimeout(loop, gap)
    }
    loop()
    return () => {
      alive = false
      window.clearTimeout(id)
      stopVibration()
    }
  }, [lit, pressing, done])

  // 다 타면 마무리 (fired 가드 + done을 deps에서 제외 → 타이머가 cleanup에 취소되지 않음)
  useEffect(() => {
    if (progress >= 1 && !fired.current) {
      fired.current = true
      setDone(true)
      const t = setTimeout(onDone, HOLD_MSG * 1000)
      return () => clearTimeout(t)
    }
  }, [progress, onDone])

  const pct = progress * 100
  const flameOn = lit && !done
  // 불길은 진행될수록 점점 세짐. 누르고 있을 때 더 활활, 떼면 잦아듦.
  const calm = pressing ? 1 : 0.7
  const flameH = (0.45 + progress * 1.15) * calm // 높이 배율 (작게 시작 → 크게)
  const flameW = (0.7 + progress * 0.5) * (pressing ? 1 : 0.92) // 폭 배율

  return (
    <div
      style={{ position: 'relative', width: 220, height: 300, touchAction: 'none' }}
      onPointerDown={() => {
        if (lit && !done) setPressing(true)
      }}
      onPointerUp={() => setPressing(false)}
      onPointerLeave={() => setPressing(false)}
      onPointerCancel={() => setPressing(false)}
    >
      {/* 광원 — 불 붙으면 밝아짐 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '42%',
          width: 240,
          height: 240,
          marginLeft: -120,
          marginTop: -120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,176,80,0.5) 0%, rgba(255,150,60,0) 64%)',
          opacity: flameOn ? (0.35 + progress * 0.6) * calm : 0.1,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      />

      {/* 연기 — 타는 동안 */}
      {flameOn &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: 80,
              width: 56,
              height: 56,
              marginLeft: -28 + (i - 1) * 22,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(190,190,195,0.32) 0%, rgba(190,190,195,0) 70%)',
              filter: 'blur(5px)',
              pointerEvents: 'none',
            }}
            initial={{ y: 30, opacity: 0, scale: 0.6 }}
            animate={{ y: [-30, -140], opacity: [0, 0.45, 0], scale: [0.6, 1.3, 1.7] }}
            transition={{ duration: 2.4, delay: i * 0.5, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}

      {/* 종이(글) — 아래에서부터 탄 만큼 깎임(진행도로 clip) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '24px 20px',
          borderRadius: 6,
          background: 'var(--paper, #fbf7f4)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
          fontFamily: 'var(--batang)',
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--ink)',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          clipPath: `inset(0% 0 ${pct}% 0)`,
          opacity: done ? 0 : 1,
          transition: 'opacity 0.5s',
          pointerEvents: 'none',
        }}
      >
        {text}
      </div>

      {/* 타는 경계(front) — 진행도 위치에 그을림 + 잉걸 + 불꽃 (점화되면 표시) */}
      {flameOn && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${pct}%`, height: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -2,
              height: 52,
              background:
                'linear-gradient(0deg, #2a1408 0%, rgba(58,30,16,0.75) 26%, rgba(96,54,28,0.3) 58%, rgba(96,54,28,0) 100%)',
              filter: 'blur(1px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -4,
              right: -4,
              bottom: -2,
              height: 6,
              borderRadius: 4,
              background: 'linear-gradient(0deg, #ff7a2f 0%, #ffd770 100%)',
              filter: 'blur(1.2px)',
              boxShadow: '0 0 16px 5px rgba(255,160,70,0.7)',
              opacity: flameOn ? 1 : 0.5,
            }}
          />
          {FLAMES.map((f, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                bottom: -4,
                width: f.w * flameW,
                height: f.h * flameH,
                marginLeft: f.dx - (f.w * flameW) / 2,
                transformOrigin: 'bottom center',
                opacity: flameOn ? 1 : 0,
                transition: 'width 0.18s, height 0.18s, opacity 0.25s',
              }}
              animate={{
                scaleY: [0.9, 1.2, 0.95, 1.12, 0.9],
                scaleX: [1, 0.88, 1.07, 0.9, 1],
                skewX: [0, -4, 4, -2, 0],
                x: [0, -2, 3, -1, 0],
              }}
              transition={{ duration: f.flick, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* 외염: 주황→빨강, 위로 갈수록 사라져 뾰족하게 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50% 50% 50% 50% / 78% 78% 32% 32%',
                  background:
                    'radial-gradient(54% 64% at 50% 82%, #ffd56e 0%, #ff9a38 28%, #ff5a1e 52%, rgba(255,70,20,0) 84%)',
                  filter: 'blur(2px)',
                }}
              />
              {/* 내염(코어): 밝은 흰-노랑, 아래쪽 */}
              <div
                style={{
                  position: 'absolute',
                  left: '24%',
                  bottom: 0,
                  width: '52%',
                  height: '62%',
                  borderRadius: '50% 50% 50% 50% / 72% 72% 36% 36%',
                  background:
                    'radial-gradient(54% 66% at 50% 84%, #fffdf2 0%, #ffec8e 42%, #ffb24d 72%, rgba(255,178,70,0) 92%)',
                  filter: 'blur(1px)',
                }}
              />
            </motion.div>
          ))}

          {/* 불티(엠버) — 위로 떠오르며 깜빡 */}
          {flameOn &&
            EMBERS.map((i) => {
              const ex = (Math.sin(i * 12.9) - 0.2) * 80
              const rise = 90 + (i % 4) * 40
              const dur = 1.1 + (i % 5) * 0.22
              const dly = (i % 6) * 0.28
              const sz = 2 + (i % 3)
              return (
                <motion.span
                  key={`e${i}`}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 4,
                    width: sz,
                    height: sz,
                    marginLeft: ex / 2,
                    borderRadius: '50%',
                    background: '#ffd073',
                    boxShadow: '0 0 6px 1px rgba(255,170,70,0.9)',
                    pointerEvents: 'none',
                  }}
                  initial={{ y: 0, x: 0, opacity: 0 }}
                  animate={{ y: [0, -rise], x: [0, ex], opacity: [0, 1, 0], scale: [1, 0.4] }}
                  transition={{ duration: dur, delay: dly, repeat: Infinity, ease: 'easeOut' }}
                />
              )
            })}
        </div>
      )}

      {/* 잿더미 — 다 탄 뒤 */}
      {done && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 64,
            width: 128,
            height: 28,
            marginLeft: -64,
            borderRadius: '50% 50% 42% 42% / 82% 82% 26% 26%',
            background: 'radial-gradient(ellipse at 50% 26%, #f6f3f2 0%, #ddd7d4 52%, #bdb6b2 100%)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.16)',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 0, scaleY: 0.35, y: 10 }}
          animate={{ opacity: 1, scaleY: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      )}

      {/* 성냥 — 끌어서 종이에 불을 붙임 (점화 전에만) */}
      {!lit && !done && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.4}
          onDrag={onMatchDrag}
          whileDrag={{ cursor: 'grabbing' }}
          style={{
            position: 'absolute',
            left: -40, // 종이 왼쪽 바깥 아래 — 여기서부터 끌어 종이에 불을 붙임
            bottom: 2,
            width: 14,
            height: 92,
            zIndex: 20,
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          {/* 성냥대 */}
          <div
            style={{
              position: 'absolute',
              left: 5,
              top: 16,
              width: 4,
              height: 74,
              borderRadius: 2,
              background: 'linear-gradient(180deg, #d8b483 0%, #9a6a3a 100%)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            }}
          />
          {/* 성냥 머리 + 작은 불씨 */}
          <div
            style={{
              position: 'absolute',
              left: 1,
              top: 0,
              width: 12,
              height: 18,
              borderRadius: '50% 50% 46% 46%',
              background: 'radial-gradient(circle at 42% 34%, #ffd07a 0%, #ff7a3a 42%, #b3301a 100%)',
              boxShadow: '0 0 10px 2px rgba(255,150,70,0.7)',
            }}
          />
        </motion.div>
      )}

      {/* 진행 게이지 — 불 붙은 뒤, 누른 정도(progress)와 '동시에' 차오름 */}
      {lit && !done && <Gauge value={progress} from="#ff7a2f" to="#ffd770" />}

      {/* 상단 행위 안내 캡션 */}
      {!done && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {lit ? '🔥 꾹 누르고 있으면 계속 타올라요' : '🔥 성냥을 끌어 종이에 불을 붙이세요'}
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {done && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
