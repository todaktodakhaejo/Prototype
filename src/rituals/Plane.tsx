import { useEffect, useRef, useState } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import type { RitualProps } from './index'
import Gauge from './Gauge'
import { useTimeOfDay } from '../hooks/useTimeOfDay'
import { rotatingMessage, PLANE_MESSAGES } from '../constants'

const MOTES = 6
const MAXPULL = 170 // 이만큼 당기면 파워 100%

// 다 날아간 자리에 별이 되어 반짝(반짝) — 색은 배경 톤에 따라 분기
function Star({ core, glow }: { core: string; glow: string }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: '50%', top: '46%', width: 160, height: 160, marginLeft: -80, marginTop: -80, pointerEvents: 'none', zIndex: 8 }}
      initial={{ scale: 0, opacity: 0, rotate: -12 }}
      animate={{ scale: [0, 1.3, 1, 1.06, 0.6], opacity: [0, 1, 1, 1, 0], rotate: [-12, 0, 0, 0, 8] }}
      transition={{ duration: 1.5, times: [0, 0.16, 0.42, 0.72, 1], ease: 'easeOut' }}
    >
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 62%)` }} />
      <svg width={160} height={160} viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, filter: `drop-shadow(0 0 8px ${glow})` }} aria-hidden>
        <path d="M50 6 L57 43 L94 50 L57 57 L50 94 L43 57 L6 50 L43 43 Z" fill={core} />
        <circle cx="50" cy="50" r="6" fill="#ffffff" />
      </svg>
      {[
        [18, 28],
        [82, 34],
        [70, 80],
        [26, 74],
      ].map(([x, y], i) => (
        <span
          key={i}
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 6, height: 6, marginLeft: -3, marginTop: -3, borderRadius: '50%', background: '#fff', boxShadow: `0 0 6px 2px ${glow}` }}
        />
      ))}
    </motion.div>
  )
}

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

  const tod = useTimeOfDay()
  // 배경이 밝은/노란 톤(일출·낮)이면 하얀 별빛, 어두운 시간대엔 연한 파스텔 노랑
  const warmBg = tod === 'dawn' || tod === 'day'
  const starCore = warmBg ? '#ffffff' : '#fff3b0'
  const starGlow = warmBg ? 'rgba(255,255,255,0.92)' : 'rgba(255,224,130,0.9)'

  // 별이 반짝인 뒤 마무리
  useEffect(() => {
    if (phase !== 'star') return
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, [phase, onDone])

  const onThrow = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (fired.current) return
    fired.current = true
    const m = Math.hypot(info.offset.x, info.offset.y)
    setDir(launchVec(info.offset.x, info.offset.y)) // 당긴 반대 방향으로 발사
    setThrowPower(0.65 + Math.min(1, m / MAXPULL) * 0.85) // 세게 당길수록 멀리
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
          onDrag={(_e, info) => setPull({ x: info.offset.x, y: info.offset.y })}
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
            x: [0, dir.x * 110, dir.x * 620 * throwPower],
            y: [0, dir.y * 110, dir.y * 600 * throwPower],
            scale: [1, 0.9, 0.16],
            opacity: [1, 1, 0],
            rotate: [0, dir.x * 16, dir.x * 26],
          }}
          transition={{ duration: 2.8, times: [0, 0.22, 1], ease: 'easeOut' }}
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
            <div
              style={{
                position: 'absolute',
                right: 6,
                top: 52,
                width: 150,
                height: 10,
                transformOrigin: 'right center',
                transform: 'rotate(24deg)',
                borderRadius: 5,
                background:
                  'linear-gradient(270deg, rgba(255,250,235,0.85) 0%, rgba(255,236,180,0.4) 35%, rgba(255,236,180,0) 100%)',
                filter: 'blur(2px)',
              }}
            />
            <PaperPlane />
          </div>
        </motion.div>
      )}

      {/* star: 다 날아간 뒤 별이 되어 반짝 */}
      {phase === 'star' && <Star core={starCore} glow={starGlow} />}

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
