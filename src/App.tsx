import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { useTimeOfDay } from './hooks/useTimeOfDay'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Write from './screens/Write'
import RitualPick from './screens/RitualPick'
import RitualAct from './screens/RitualAct'
import Afterglow from './screens/Afterglow'
import Released from './screens/Released'
import type { Step } from './types'

const SCREENS: Record<Step, () => JSX.Element | null> = {
  ONBOARDING: Onboarding,
  HOME: Home,
  WRITE: Write,
  RITUAL_PICK: RitualPick,
  RITUAL_ACT: RitualAct,
  AFTERGLOW: Afterglow,
  RELEASED: Released,
}

export default function App() {
  const step = useStore((s) => s.step)
  const tod = useTimeOfDay()
  const Screen = SCREENS[step]

  return (
    <div className="app-frame" data-tod={tod}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
