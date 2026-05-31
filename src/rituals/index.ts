import type { RitualId } from '../types'
import Burn from './Burn'
import Crumple from './Crumple'
import Tear from './Tear'

export interface RitualProps {
  text: string
  onDone: () => void
}

export const RITUAL_COMPONENTS: Record<RitualId, (p: RitualProps) => JSX.Element> = {
  burn: Burn,
  crumple: Crumple,
  tear: Tear,
}
