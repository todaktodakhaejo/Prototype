import { useStore } from '../store'
import { RITUAL_COMPONENTS } from '../rituals'

export default function RitualAct() {
  const draftText = useStore((s) => s.draftText)
  const selectedRitual = useStore((s) => s.selectedRitual)
  const finishRitual = useStore((s) => s.finishRitual)

  // 선택된 의식 컴포넌트를 렌더하고, 완료되면 finishRitual로 허브 복귀.
  // (selectedRitual이 비면 그냥 빈 렌더 — finishRitual을 effect로 자동 호출하지 않는다.
  //  자동 호출하면 화면 전환 exit 도중 상태가 계속 갱신돼 다음 화면이 안 뜸)
  if (!selectedRitual) return null
  const Ritual = RITUAL_COMPONENTS[selectedRitual]
  return <Ritual text={draftText} onDone={finishRitual} />
}
