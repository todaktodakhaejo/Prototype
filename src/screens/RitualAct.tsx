import { useEffect } from 'react'
import { useStore } from '../store'
import { RITUAL_COMPONENTS } from '../rituals'

export default function RitualAct() {
  const draftText = useStore((s) => s.draftText)
  const selectedRitual = useStore((s) => s.selectedRitual)
  const finishRitual = useStore((s) => s.finishRitual)

  // 방어: 의식 미선택 상태로 들어오면 다음 단계로 (렌더 중이 아니라 effect에서)
  useEffect(() => {
    if (!selectedRitual) finishRitual()
  }, [selectedRitual, finishRitual])

  if (!selectedRitual) return null

  const Ritual = RITUAL_COMPONENTS[selectedRitual]
  return <Ritual text={draftText} onDone={finishRitual} />
}
