import { useStore } from '../store'
import MoodScale from '../components/MoodScale'
import { MOOD_POST_TITLE } from '../constants'

// KPI 모드: 공놀이 및 의식 활동 직후 기분
export default function MoodPost() {
  const submit = useStore((s) => s.submitMoodPost)
  return <MoodScale title={MOOD_POST_TITLE} onSubmit={submit} />
}
