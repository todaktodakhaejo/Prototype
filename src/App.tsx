import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { useTimeOfDay } from './hooks/useTimeOfDay'
import { phCapture } from './posthog'
import Onboarding from './screens/Onboarding'
import MoodPre from './screens/MoodPre'
import Home from './screens/Home'
import RitualPrompt from './screens/RitualPrompt'
import Write from './screens/Write'
import RitualPick from './screens/RitualPick'
import RitualAct from './screens/RitualAct'
import RitualAgain from './screens/RitualAgain'
import Released from './screens/Released'
import MoodPost from './screens/MoodPost'
import StartupNotice from './components/StartupNotice'
import type { Step } from './types'

const SCREENS: Record<Step, () => JSX.Element | null> = {
  ONBOARDING: Onboarding,
  MOOD_PRE: MoodPre,
  HOME: Home,
  RITUAL_PROMPT: RitualPrompt,
  WRITE: Write,
  RITUAL_PICK: RitualPick,
  RITUAL_ACT: RitualAct,
  RITUAL_AGAIN: RitualAgain,
  RELEASED: Released,
  MOOD_POST: MoodPost,
}

export default function App() {
  const step = useStore((s) => s.step)
  const tod = useTimeOfDay()
  const Screen = SCREENS[step]

  // 화면 전환마다 PostHog screen_view 이벤트(퍼널/리텐션 분석용)
  useEffect(() => {
    phCapture('screen_view', { step })
  }, [step])

  return (
    <>
      <div className="app-frame" data-tod={tod}>
        {/* 시간대 배경 — tod가 바뀌면 새 그라데이션 레이어가 1.8s 페이드인하며 잔잔히 전환 */}
        <AnimatePresence>
          <motion.div
            key={tod}
            className="bg-layer"
            data-tod={tod}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        </AnimatePresence>

        {/* mode="wait" 제거: 새 화면이 즉시 마운트되어 전환 중 빈 화면이 생기지 않음 */}
        <AnimatePresence>
          <motion.div
            key={step}
            className="screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
      <StartupNotice />
    </>
  )
}
