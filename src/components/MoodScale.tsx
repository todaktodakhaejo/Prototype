import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOOD_MAX, MOOD_LOW_LABEL, MOOD_HIGH_LABEL } from '../constants'

interface Props {
  title: string
  onSubmit: (value: number) => void
}

// 0~MOOD_MAX 슬라이더(정수 스냅, 연속 밀기 X) — 밀어서 고르고 [확인]으로 제출.
// 양 끝 캡션(0=마음이 가벼움 / 10=마음이 무거움)으로 '기분 좋다고 10 체크'하는 오인을 방지.
export default function MoodScale({ title, onSubmit }: Props) {
  const [value, setValue] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%', maxWidth: 340 }}
    >
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 18, lineHeight: 1.5, maxWidth: 320 }}>
        {title}
      </p>

      {/* 현재 선택값 (크게) */}
      <div className="serif" style={{ color: 'var(--on-bg)', fontSize: 46, lineHeight: 1 }}>
        {value}
      </div>

      {/* 슬라이더 — step=1이라 0~10 정수에만 멈춤(연속 X), 시작값 0 */}
      <input
        className="mood-slider"
        type="range"
        min={0}
        max={MOOD_MAX}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        aria-label="기분 점수 (0~10)"
      />

      {/* 양 끝 캡션 — 폴라리티 오인 방지 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          color: 'var(--on-bg)',
          opacity: 0.75,
          fontSize: 12,
          lineHeight: 1.4,
        }}
      >
        <span style={{ textAlign: 'left' }}>
          0<br />
          {MOOD_LOW_LABEL}
        </span>
        <span style={{ textAlign: 'right' }}>
          {MOOD_MAX}
          <br />
          {MOOD_HIGH_LABEL}
        </span>
      </div>

      <button className="btn" style={{ marginTop: 8 }} onClick={() => onSubmit(value)}>
        확인
      </button>
    </motion.div>
  )
}
