import type { RitualId } from '../types'
import Burn from './Burn'
import Shred from './Shred'
import Plane from './Plane'
import Jewelbox from './Jewelbox'

export interface RitualProps {
  text: string
  onDone: () => void
}

export const RITUAL_COMPONENTS: Record<RitualId, (p: RitualProps) => JSX.Element> = {
  burn: Burn,
  shred: Shred,
  plane: Plane,
  jewelbox: Jewelbox,
}
