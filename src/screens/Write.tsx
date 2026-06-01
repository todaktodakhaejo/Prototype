import { useStore } from '../store'

export default function Write() {
  const draftText = useStore((s) => s.draftText)
  const setDraft = useStore((s) => s.setDraft)
  const goPickRitual = useStore((s) => s.goPickRitual)

  return (
    <>
      <p className="serif" style={{ color: 'var(--on-bg)', fontSize: 17, marginBottom: 20, opacity: 0.85, whiteSpace: 'nowrap' }}>
        지금 마음을 있는 그대로 털어놓아 볼까요
      </p>

      <textarea
        autoFocus
        value={draftText}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="아무도 보지 않아요. 마구 적어 내려가도 괜찮아요."
        style={{
          width: '100%',
          flex: '0 1 50%',
          minHeight: 220,
          resize: 'none',
          border: 'none',
          outline: 'none',
          borderRadius: 18,
          padding: '20px',
          fontFamily: 'var(--batang)',
          fontSize: 16,
          lineHeight: 1.8,
          color: 'var(--ink)',
          background: 'var(--paper)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        }}
      />

      <button
        className="btn"
        style={{ marginTop: 28 }}
        disabled={draftText.trim().length === 0}
        onClick={goPickRitual}
      >
        다 적었어요
      </button>
    </>
  )
}
