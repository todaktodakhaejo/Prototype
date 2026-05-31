import { useStore } from '../store'
import MoodScale from '../components/MoodScale'
import { MOOD_PRE_TITLE } from '../constants'

// KPI 모드: 공놀이 전 기분 (라운드 시작 베이스라인)
export default function MoodPre() {
  const submit = useStore((s) => s.submitMoodPre)
  return <MoodScale title={MOOD_PRE_TITLE} onSubmit={submit} />
}
