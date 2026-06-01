import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// 시작 시 오른쪽 하단에서 잔잔하게 나오는 이용 환경 안내 말풍선.
//  잠시 보였다가 스스로 사라지고, × 로 바로 닫을 수도 있다. (앱 로드당 1회)
export default function StartupNotice() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 13000) // 잔잔히 머물다 자동으로 사라짐
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 50,
            maxWidth: 300,
            padding: '14px 30px 14px 16px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.93)',
            color: 'var(--ink)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            fontFamily: 'var(--batang)',
            fontSize: 13,
            lineHeight: 1.7,
            textAlign: 'left',
          }}
        >
          <button
            onClick={() => setShow(false)}
            aria-label="닫기"
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--ink-mute)',
              fontSize: 17,
              lineHeight: 1,
            }}
          >
            ×
          </button>
          <p style={{ fontWeight: 700, marginBottom: 6 }}>📱 이용 환경 안내</p>
          <p>
            크롬·사파리·삼성인터넷 최신 버전을 권장합니다. iOS는 15.4 이상에서 가장 잘 보입니다. 카카오톡
            등 앱 안의 브라우저보다 기본 브라우저로, 가능하면 휴대폰으로 열어 주시기 바랍니다.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
