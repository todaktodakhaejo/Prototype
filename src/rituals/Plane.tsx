import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import Gauge from './Gauge'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { rotatingMessage, PLANE_MESSAGES } from '../constants'
import { hapticTension, hapticLaunch, stopVibration } from '../haptics'

const PULL_HAPTIC_PX = 12 // 당기는 긴장감 진동 1펄스당 당김 변화량(px)

const MOTES = 6
const MAXPULL = 170 // 이만큼 당기면 파워 100%

// 다 날아간 자리에 별빛으로 반짝 — 사방으로 빛줄기가 뻗는 별(레퍼런스)
function Star({ glow }: { glow: string }) {
  const rays = 12
  return (
    <motion.div
      style={{ position: 'absolute', left: '50%', top: '44%', width: 200, height: 200, marginLeft: -100, marginTop: -100, pointerEvents: 'none', zIndex: 8 }}
      initial={{ scale: 0.2, opacity: 0, rotate: -8 }}
      animate={{ scale: [0.2, 1.15, 1, 1.04, 0.9], opacity: [0, 1, 1, 1, 0], rotate: [-8, 0, 2, 3, 6] }}
      transition={{ duration: 1.8, times: [0, 0.18, 0.45, 0.75, 1], ease: 'easeOut' }}
    >
      {/* 부드러운 글로우 */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, rgba(255,255,255,0.12) 26%, rgba(255,255,255,0) 60%)` }} />
      {/* 빛줄기(레이) — 길고 짧은 게 번갈아 */}
      {Array.from({ length: rays }).map((_, i) => {
        const ang = (360 / rays) * i
        const long = i % 2 === 0
        const h = long ? 190 : 96
        const w = long ? 3 : 2
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: w,
              height: h,
              marginLeft: -w / 2,
              marginTop: -h / 2,
              transformOrigin: '50% 50%',
              transform: `rotate(${ang}deg)`,
              background: `linear-gradient(0deg, rgba(255,255,255,0) 0%, ${glow} 42%, #ffffff 50%, ${glow} 58%, rgba(255,255,255,0) 100%)`,
              filter: 'blur(0.6px)',
              opacity: long ? 0.95 : 0.6,
            }}
          />
        )
      })}
      {/* 밝은 코어 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 22,
          height: 22,
          marginLeft: -11,
          marginTop: -11,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, #ffffff 30%, rgba(255,255,255,0) 72%)',
          boxShadow: `0 0 18px 6px ${glow}`,
        }}
      />
    </motion.div>
  )
}

// 분사한 연료가 모여 만들어진 구름 — 여러 겹 블롭 + 블러로 적당히 사실적인 뭉게구름
const CLOUD_PUFFS = [
  { x: 38, y: 58, r: 56 },
  { x: 74, y: 40, r: 74 },
  { x: 116, y: 38, r: 66 },
  { x: 150, y: 56, r: 50 },
  { x: 58, y: 62, r: 50 },
  { x: 100, y: 64, r: 52 },
  { x: 134, y: 62, r: 46 },
  { x: 92, y: 28, r: 52 },
]

function Cloud({ left, top, scale, opacity, delay, drift }: { left: string; top: string; scale: number; opacity: number; delay: number; drift: number }) {
  return (
    <motion.div
      style={{ position: 'absolute', left, top, width: 196, height: 96, marginLeft: -98, marginTop: -48, pointerEvents: 'none', zIndex: 7, filter: 'blur(2px)' }}
      initial={{ opacity: 0, x: -drift, scale }}
      animate={{ opacity: [0, opacity, opacity], x: [-drift, 0, drift], scale }}
      transition={{ duration: 2.6, delay, times: [0, 0.4, 1], ease: 'easeOut' }}
    >
      {CLOUD_PUFFS.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.r,
            height: p.r * 0.92,
            marginLeft: -p.r / 2,
            marginTop: -(p.r * 0.92) / 2,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 38%, #ffffff 0%, #f4f6fb 52%, rgba(244,246,251,0.5) 74%, rgba(244,246,251,0) 90%)',
          }}
        />
      ))}
    </motion.div>
  )
}

// 하늘에 고루 흩어 떠 있는 구름들 — 중앙(별빛 자리)을 비우고 상단 모서리 + 하단에 배치
const CLOUDS = [
  { left: '15%', top: '13%', scale: 0.58, opacity: 0.85, delay: 0.1, drift: 12 },
  { left: '85%', top: '16%', scale: 0.66, opacity: 0.88, delay: 0.0, drift: 14 },
  { left: '20%', top: '72%', scale: 0.5, opacity: 0.74, delay: 0.4, drift: 9 },
  { left: '82%', top: '68%', scale: 0.54, opacity: 0.76, delay: 0.5, drift: 10 },
  { left: '50%', top: '88%', scale: 0.6, opacity: 0.84, delay: 0.25, drift: 12 },
]

// 슬링샷 물리: 당긴 '반대' 방향으로, 항상 하늘(위)을 향해 사선 발사
function launchVec(px: number, py: number) {
  let dx = -px
  let dy = -py
  if (Math.hypot(dx, dy) < 20) {
    dx = 0
    dy = -1
  } // 거의 안 당기고 놓으면 위로
  const m = Math.hypot(dx, dy) || 1
  return { x: dx / m, y: Math.min(dy / m, -0.3) } // 항상 위로 향함
}

// 종이비행기 SVG
function PaperPlane() {
  return (
    <svg width={120} height={90} viewBox="0 0 120 90" aria-hidden style={{ position: 'relative' }}>
      <polygon points="10,82 112,8 60,56" fill="#ffffff" />
      <polygon points="112,8 60,56 80,82" fill="#efe7dd" />
    </svg>
  )
}

// 날리기 — 종이를 '탭하면 비행기로 접히고', 그 비행기를 '던지면(드래그-놓기)' 날아간다(seamless).
//  paper(탭) → plane(던질 수 있음) → flying(날아가고 onAnimationComplete로 완료).
export default function Plane({ text, onDone }: RitualProps) {
  const [msg] = useState(() => rotatingMessage('plane', PLANE_MESSAGES))
  const [phase, setPhase] = useState<'paper' | 'plane' | 'flying' | 'star'>('paper')
  const [dir, setDir] = useState({ x: 0.5, y: -1 })
  const [pull, setPull] = useState({ x: 0, y: 0 }) // 당기는 동안의 오프셋(미리보기)
  const [throwPower, setThrowPower] = useState(1) // 던진 세기(비행 거리 배율)
  const fired = useRef(false)
  const pullMag = useRef(0) // 긴장감 햅틱: 직전 당김 크기
  const pullAcc = useRef(0) // 긴장감 햅틱: 당김 변화 누적

  // 화면 이탈 시 진동 정리
  useEffect(() => () => stopVibration(), [])

  // 당기는 동안 긴장감 — 당김 변화가 쌓일 때마다 세기에 비례한 약한 펄스
  const onPull = (info: PanInfo) => {
    setPull({ x: info.offset.x, y: info.offset.y })
    const m = Math.hypot(info.offset.x, info.offset.y)
    pullAcc.current += Math.abs(m - pullMag.current)
    pullMag.current = m
    if (pullAcc.current >= PULL_HAPTIC_PX) {
      pullAcc.current = 0
      hapticTension(Math.min(1, m / MAXPULL))
    }
  }

  const tod = useTimeOfDay()
  // 배경이 밝은/노란 톤(일출·낮)이면 하얀 별빛, 어두운 시간대엔 연한 파스텔 노랑
  const warmBg = tod === 'dawn' || tod === 'day'
  // 코어는 흰빛, 글로우만 톤별로(어두운 밤=차가운 청백, 밝은 낮=따뜻한 백색)
  const starGlow = warmBg ? 'rgba(255,246,224,0.95)' : 'rgba(214,232,255,0.95)'

  // 별이 반짝인 뒤 마무리
  useEffect(() => {
    if (phase !== 'star') return
    const t = setTimeout(onDone, 3000) // 별빛 + 구름들이 떠오르는 동안 머무름
    return () => clearTimeout(t)
  }, [phase, onDone])

  const onThrow = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (fired.current) return
    fired.current = true
    const m = Math.hypot(info.offset.x, info.offset.y)
    setDir(launchVec(info.offset.x, info.offset.y)) // 당긴 반대 방향으로 발사
    setThrowPower(1.1 + Math.min(1, m / MAXPULL) * 1.2) // 세게 당길수록 더 힘차게 멀리
    hapticLaunch(Math.min(1, m / MAXPULL)) // 발사 순간 짧은 한 방
    pullAcc.current = 0
    pullMag.current = 0
    setPhase('flying')
  }

  const power = Math.min(1, Math.hypot(pull.x, pull.y) / MAXPULL)
  const aim = launchVec(pull.x, pull.y) // 미리보기: 실제 발사 방향(당긴 반대·위로)
  const angleDeg = (Math.atan2(aim.y, aim.x) * 180) / Math.PI
  const dirAngle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI // 발사 후 비행 방향(코끝 유지용)

  return (
    <div style={{ position: 'relative', width: 240, height: 320, touchAction: 'none' }}>
      {/* 떠다니는 빛 입자 */}
      {Array.from({ length: MOTES }).map((_, i) => {
        const left = 18 + ((i * 47) % 200)
        const top = 40 + ((i * 83) % 220)
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 0 8px 2px rgba(255,228,160,0.7)',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.8, 0], y: [0, -26, -52] }}
            transition={{ duration: 3, delay: (i % 3) * 0.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        )
      })}

      {/* paper: 종이(글) — 탭하면 비행기로 접힘 */}
      {phase === 'paper' && (
        <motion.div
          onTap={() => setPhase('plane')}
          whileTap={{ scale: 0.97 }}
          style={{
            position: 'absolute',
            inset: 0,
            padding: '24px 20px',
            borderRadius: 6,
            background: 'var(--paper, #fbf7f4)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
            fontFamily: 'var(--batang)',
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--ink)',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            cursor: 'pointer',
            touchAction: 'none',
          }}
          exit={{ opacity: 0 }}
        >
          {text}
        </motion.div>
      )}

      {/* plane: 접힌 비행기 — 잡고 던질 수 있음 */}
      {phase === 'plane' && (
        <motion.div
          drag
          dragSnapToOrigin
          dragElastic={0.5}
          onDrag={(_e, info) => onPull(info)}
          onDragEnd={onThrow}
          whileDrag={{ cursor: 'grabbing' }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none',
          }}
          // 종이가 막 접혀 비행기가 된 느낌(가로로 펴지며 등장) + 살짝 둥실
          initial={{ scaleX: 0.3, scaleY: 0.6, opacity: 0 }}
          animate={{ scaleX: 1, scaleY: 1, opacity: 1, y: [0, -6, 0] }}
          transition={{ scaleX: { duration: 0.45 }, scaleY: { duration: 0.45 }, opacity: { duration: 0.3 }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          {/* 당기는 방향(=발사 방향)으로 코끝이 향하도록 회전. 기본 코 방향 ≈ -38° 보정 */}
          <div style={{ transform: `rotate(${power > 0.04 ? angleDeg + 38 : 0}deg)`, transition: 'transform 0.06s linear' }}>
            <PaperPlane />
          </div>
        </motion.div>
      )}

      {/* flying: 던진 방향·세기로 날아감 → 끝나면 onDone */}
      {phase === 'flying' && (
        <motion.div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            x: [0, dir.x * 200, dir.x * 940 * throwPower],
            y: [0, dir.y * 200, dir.y * 900 * throwPower],
            scale: [1, 0.82, 0.1],
            opacity: [1, 1, 0],
            rotate: [0, dir.x * 14, dir.x * 22],
          }}
          transition={{ duration: 1.7, times: [0, 0.16, 1], ease: 'easeOut' }}
          onAnimationComplete={() => setPhase('star')}
        >
          <div style={{ position: 'relative', transform: `rotate(${dirAngle + 38}deg)` }}>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 120,
                height: 120,
                transform: 'translate(-50%,-50%)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,236,180,0.5) 0%, rgba(255,236,180,0) 70%)',
              }}
            />
            <PaperPlane />
          </div>
        </motion.div>
      )}

      {/* flying: 비행 중 뒤로 뿜는 연료 — 경로를 따라 크고 밝게 뿜어져 머물다 흩어짐 */}
      {phase === 'flying' &&
        Array.from({ length: 9 }).map((_, j) => {
          const t = j / 8
          const dist = 24 + t * 210
          const px = dir.x * dist
          const py = dir.y * dist
          const dly = t * 0.42 // 비행 중(0~0.42s) 빠르게 분사
          const sz = 32 + t * 36
          return (
            <motion.span
              key={`fuel${j}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: sz,
                height: sz,
                marginLeft: -sz / 2,
                marginTop: -sz / 2,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(255,246,214,0.98) 0%, rgba(255,198,112,0.85) 36%, rgba(255,148,66,0.5) 64%, rgba(255,148,66,0) 100%)',
                filter: 'blur(3px)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
              animate={{ x: px, y: py, opacity: [0, 1, 0.85, 0], scale: [0.5, 1.1, 1.5, 2.1] }}
              transition={{ duration: 1.25, delay: dly, times: [0, 0.2, 0.55, 1], ease: 'easeOut' }}
            />
          )
        })}

      {/* star: 다 날아간 뒤 별빛으로 반짝 + 연료가 구름이 되어 하늘에 떠오름 */}
      {phase === 'star' && <Star glow={starGlow} />}
      {phase === 'star' && CLOUDS.map((c, i) => <Cloud key={i} left={c.left} top={c.top} scale={c.scale} opacity={c.opacity} delay={c.delay} drift={c.drift} />)}

      {/* 당기는 동안: 방향 화살표 (슬링샷처럼 — 당긴 방향·세기 미리보기) */}
      {phase === 'plane' && power > 0.04 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 40 + power * 120,
            height: 6,
            marginTop: -3,
            transformOrigin: '0% 50%',
            transform: `rotate(${angleDeg}deg)`,
            pointerEvents: 'none',
            zIndex: 6,
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, right: 14, bottom: 0, borderRadius: 3, background: 'linear-gradient(90deg, rgba(174,224,232,0.15), rgba(174,224,232,0.95))' }} />
          <div style={{ position: 'absolute', right: 0, top: -5, width: 0, height: 0, borderLeft: '16px solid rgba(174,224,232,0.95)', borderTop: '8px solid transparent', borderBottom: '8px solid transparent' }} />
        </div>
      )}

      {/* 파워 게이지 — 당긴 세기 */}
      {phase === 'plane' && <Gauge value={power} from="#5b8fd6" to="#aee0e8" />}

      {/* 상단 행위 안내 캡션 */}
      {(phase === 'paper' || phase === 'plane') && (
        <div style={{ position: 'absolute', top: -44, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(30,22,40,0.55)', color: '#fff', fontSize: 13, padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {phase === 'paper' ? '👆 종이를 탭하면 비행기로 접혀요' : '✈️ 당겼다 놓으면 날아가요'}
          </span>
        </div>
      )}

      {/* 마무리 멘트 */}
      {(phase === 'flying' || phase === 'star') && (
        <motion.p
          className="serif"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 16, textAlign: 'center', color: 'var(--on-bg)', fontSize: 16, whiteSpace: 'pre-line', pointerEvents: 'none' }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          {msg}
        </motion.p>
      )}
    </div>
  )
}
