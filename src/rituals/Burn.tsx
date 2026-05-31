import { motion } from 'framer-motion'
import type { RitualProps } from './index'

const D = 2.9

// 일렁이는 불꽃 갈래 (바닥에서 솟음) — 폭/높이/위치/속도 제각각
const FLAMES = [
  { dx: -36, w: 26, h: 74, flick: 0.42 },
  { dx: -15, w: 34, h: 104, flick: 0.5 },
  { dx: 4, w: 42, h: 128, flick: 0.46 },
  { dx: 24, w: 34, h: 98, flick: 0.54 },
  { dx: 44, w: 24, h: 70, flick: 0.4 },
]
const EMBERS = 12

// 태우기:
//  STEP1 종이 떠있음 → STEP2 바닥에서 불꽃이 일렁이며 검은 그을림이 위로 타올라감
//  STEP3 종이가 재가 되어 사라지고, 불티가 위로 흩날림
export default function Burn({ text, onDone }: RitualProps) {
  return (
    <div style={{ position: 'relative', width: 220, height: 280 }}>
      {/* 따뜻한 광원 — 바닥에서 번지는 불빛 */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -10,
          width: 240,
          height: 200,
          marginLeft: -120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,160,60,0.5) 0%, rgba(255,120,40,0) 65%)',
          pointerEvents: 'none',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0.9, 0] }}
        transition={{ duration: D, times: [0, 0.35, 0.8, 1], ease: 'easeInOut' }}
      />

      {/* 종이(글) — 그을려 어두워지며 떠올라 사라짐 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '24px 20px',
          borderRadius: 6,
          background: 'var(--paper, #fbf7f4)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
          fontFamily: 'var(--batang)',
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--ink)',
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
        }}
        initial={{ opacity: 1, filter: 'brightness(1)' }}
        animate={{
          opacity: [1, 1, 1, 0],
          filter: [
            'brightness(1)',
            'brightness(0.82) sepia(0.5)',
            'brightness(0.4) sepia(1)',
            'brightness(0)',
          ],
          y: [0, -6, -18, -44],
        }}
        transition={{ duration: D, times: [0, 0.4, 0.78, 1], ease: 'easeIn' }}
        onAnimationComplete={onDone}
      >
        {text}

        {/* 타들어가는 검은 그을림 front — 아래에서 위로, 윗변에 이글거리는 잉걸 */}
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            transformOrigin: 'bottom',
            background:
              'linear-gradient(0deg, #140c10 0%, #140c10 55%, rgba(20,12,16,0) 100%)',
            pointerEvents: 'none',
          }}
          initial={{ height: '0%' }}
          animate={{ height: ['0%', '28%', '108%'] }}
          transition={{ duration: D, times: [0, 0.4, 1], ease: 'easeIn' }}
        >
          <div
            style={{
              position: 'absolute',
              top: -4,
              left: 0,
              right: 0,
              height: 8,
              background: 'linear-gradient(0deg, #ff5a1f 0%, #ffd24d 100%)',
              filter: 'blur(2px)',
              boxShadow: '0 0 14px 4px rgba(255,130,40,0.85)',
            }}
          />
        </motion.div>
      </motion.div>

      {/* 불꽃 갈래 — 바닥에서 일렁임 (그룹 opacity로 등장/소멸, 개별 flicker는 무한 반복) */}
      <motion.div
        style={{ position: 'absolute', left: 0, right: 0, bottom: 6, height: 0, pointerEvents: 'none' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: D, times: [0, 0.25, 0.78, 1], ease: 'easeInOut' }}
      >
        {FLAMES.map((f, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              width: f.w,
              height: f.h,
              marginLeft: f.dx - f.w / 2,
              transformOrigin: 'bottom center',
              borderRadius: '50% 50% 50% 50% / 70% 70% 42% 42%',
              background:
                'radial-gradient(50% 62% at 50% 72%, #ffe98a 0%, #ff9a3d 46%, #ff5a1f 74%, rgba(255,90,31,0) 100%)',
              filter: 'blur(1px)',
            }}
            animate={{
              scaleY: [0.85, 1.18, 0.92, 1.12, 0.85],
              scaleX: [1, 0.86, 1.06, 0.9, 1],
              x: [0, -3, 2, -2, 0],
              opacity: [0.85, 1, 0.9, 1, 0.85],
            }}
            transition={{ duration: f.flick, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {/* 불티(ember) — 위로 흩날리며 사라짐 */}
      {Array.from({ length: EMBERS }).map((_, i) => {
        const dx = ((i % 5) - 2) * 26 + (i % 2 ? 8 : -8)
        const rise = 150 + (i % 4) * 40
        return (
          <motion.span
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 30,
              width: 4,
              height: 4,
              marginLeft: -2,
              borderRadius: '50%',
              background: '#ffd24d',
              boxShadow: '0 0 6px 2px rgba(255,150,50,0.8)',
              pointerEvents: 'none',
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: [0, dx * 0.5, dx], y: [0, -rise * 0.6, -rise], opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, delay: 0.5 + (i % 6) * 0.18, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
