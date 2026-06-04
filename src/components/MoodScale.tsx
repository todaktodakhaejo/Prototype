import { useState } from 'react'
import { motion } from 'framer-motion'
import { MOOD_MAX, MOOD_LOW_LABEL, MOOD_HIGH_LABEL } from '../constants'

interface Props {
  title: string
  onSubmit: (value: number) => void
  reserveBottom?: boolean // 시작화면: 하단 안내 말풍선과 겹치지 않게 콘텐츠를 위로 띄움
}

// 0~MOOD_MAX 슬라이더(정수 스냅, 연속 밀기 X) — 밀어서 고르고 [확인]으로 제출.
// 양 끝 캡션(0=매우 안 좋다 / 10=매우 좋다)으로 방향(높을수록 좋음)을 명확히.
export default function MoodScale({ title, onSubmit, reserveBottom }: Props) {
  const [value, setValue] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, width: '100%', maxWidth: 340, paddingBottom: reserveBottom ? 160 : 0 }}
    >
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 18, lineHeight: 1.5, maxWidth: 320, whiteSpace: 'pre-line' }}>
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

      {/* 양 끝 캡션 — 폴라리티 오인 방지. 박스 없이 글씨만 굵고 크게(배경별 대비색 --on-bg 사용) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', color: 'var(--on-bg)' }}>
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, fontSize: 15, fontWeight: 800, lineHeight: 1.25, textShadow: '0 1px 2px rgba(0,0,0,0.22)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>0</span>
          {MOOD_LOW_LABEL}
        </span>
        <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, fontSize: 15, fontWeight: 800, lineHeight: 1.25, textShadow: '0 1px 2px rgba(0,0,0,0.22)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{MOOD_MAX}</span>
          {MOOD_HIGH_LABEL}
        </span>
      </div>

      <button className="btn" style={{ marginTop: 8 }} onClick={() => onSubmit(value)}>
        확인
      </button>
    </motion.div>
  )
}
