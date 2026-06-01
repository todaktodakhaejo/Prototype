import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { useTimeOfDay } from './hooks/useTimeOfDay'
import Onboarding from './screens/Onboarding'
import MoodPre from './screens/MoodPre'
import Home from './screens/Home'
import RitualPrompt from './screens/RitualPrompt'
import Write from './screens/Write'
import RitualPick from './screens/RitualPick'
import RitualAct from './screens/RitualAct'
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
  RELEASED: Released,
  MOOD_POST: MoodPost,
}

export default function App() {
  const step = useStore((s) => s.step)
  const tod = useTimeOfDay()
  const Screen = SCREENS[step]

  return (
    <>
      <div className="app-frame" data-tod={tod}>
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
