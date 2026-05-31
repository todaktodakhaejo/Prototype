import Paper from './Paper'
import type { RitualProps } from './index'

// 구기기: STEP1 평평 → STEP2 점점 작아지며 구겨짐 → STEP3 공처럼 날아감
export default function Crumple({ text, onDone }: RitualProps) {
  return (
    <Paper
      text={text}
      initial={{ scale: 1, rotate: 0, borderRadius: 6, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [1, 0.45, 0.3, 0.2],
        rotate: [0, -8, 14, 40],
        borderRadius: ['6px', '40%', '50%', '50%'],
        x: [0, 10, 60, 320],
        y: [0, 20, -20, -160],
        opacity: [1, 1, 1, 0],
      }}
      transition={{ duration: 2.4, times: [0, 0.4, 0.7, 1], ease: 'easeIn' }}
      onAnimationComplete={onDone}
    />
  )
}
