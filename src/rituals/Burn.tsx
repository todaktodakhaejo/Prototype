import { motion } from 'framer-motion'
import Paper from './Paper'
import type { RitualProps } from './index'

// 태우기: STEP1 종이 떠있음 → STEP2 아래에서 위로 그을림 → STEP3 사라짐
export default function Burn({ text, onDone }: RitualProps) {
  return (
    <Paper
      text={text}
      initial={{ opacity: 1, filter: 'brightness(1)' }}
      animate={{
        opacity: [1, 1, 0],
        filter: ['brightness(1)', 'brightness(0.5) sepia(1)', 'brightness(0)'],
        y: [0, -10, -30],
      }}
      transition={{ duration: 2.6, times: [0, 0.6, 1], ease: 'easeIn' }}
      onAnimationComplete={onDone}
    >
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 1, 1], scaleY: [0, 1, 1.2] }}
        transition={{ duration: 2.6, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '70%',
          transformOrigin: 'bottom',
          background: 'linear-gradient(0deg, #ff8a3d 0%, rgba(255,138,61,0) 100%)',
          pointerEvents: 'none',
        }}
      />
    </Paper>
  )
}
