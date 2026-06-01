import { motion } from 'framer-motion'
import { useStore } from '../store'
import { RITUALS } from '../constants'
import { KPI_ENABLED } from '../analytics'

// 의식 허브 — 한 번 쓴 글을 여러 방식으로 흘려보낸다(자유 흐름).
//  의식 고르기 → 연출 → 다시 이 허브로. 여기서 또 고르거나, 글 고치기 / 공놀이 더 / 마치기.
export default function RitualPick() {
  const pickRitual = useStore((s) => s.pickRitual)
  const editWriting = useStore((s) => s.editWriting)
  const backToPlay = useStore((s) => s.backToPlay)
  const finishSession = useStore((s) => s.finishSession)
  const done = useStore((s) => s.ritualsThisSession)

  return (
    <>
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 20, marginBottom: done === 0 ? 26 : 6 }}>
        {done === 0 ? '감정을 어떻게 흘려보낼까요' : '또 흘려보낼까요?'}
      </p>
      {done > 0 && (
        <p className="muted" style={{ color: 'var(--on-bg)', opacity: 0.6, marginBottom: 26 }}>
          {`지금까지 ${done}번 흘려보냈어요 · 여러 번 해도 괜찮아요`}
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 92px)', gap: 16, justifyContent: 'center' }}>
        {RITUALS.map((r, idx) => (
          <motion.button
            key={r.id}
            onClick={() => pickRitual(r.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            style={{
              width: 92,
              height: 116,
              border: 'none',
              borderRadius: 18,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.82)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 32 }}>{r.emoji}</span>
            <span style={{ fontFamily: 'var(--batang)', fontSize: 14, color: 'var(--ink)' }}>{r.label}</span>
          </motion.button>
        ))}
      </div>

      {/* 자유 흐름 내비 (KPI 모드) */}
      {KPI_ENABLED && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 26 }}>
          <button className="btn" onClick={finishSession}>
            이제 마칠래요
          </button>
          <div style={{ display: 'flex', gap: 18 }}>
            <button
              onClick={editWriting}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--on-bg)',
                opacity: 0.72,
                fontFamily: 'var(--batang)',
                fontSize: 13,
                textDecoration: 'underline',
              }}
            >
              글 다시 쓰기
            </button>
            <button
              onClick={backToPlay}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--on-bg)',
                opacity: 0.72,
                fontFamily: 'var(--batang)',
                fontSize: 13,
                textDecoration: 'underline',
              }}
            >
              공놀이 더 하기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
