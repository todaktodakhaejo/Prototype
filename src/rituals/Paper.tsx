import type { ReactNode } from 'react'
import { motion, type MotionProps } from 'framer-motion'

// 작성 텍스트가 얹힌 종이 — 모든 의식이 공유하는 기본 비주얼
export default function Paper({
  text,
  children,
  ...motionProps
}: { text: string; children?: ReactNode } & MotionProps) {
  return (
    <motion.div
      {...motionProps}
      style={{
        position: 'relative',
        width: 220,
        minHeight: 280,
        padding: '24px 20px',
        borderRadius: 6,
        background: 'var(--paper)',
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
    >
      {text}
      {children}
    </motion.div>
  )
}
