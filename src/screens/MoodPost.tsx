import { useStore } from '../store'
import MoodScale from '../components/MoodScale'
import { MOOD_POST_BALL_TITLE, MOOD_POST_RITUAL_TITLE } from '../constants'

// KPI 모드: 활동 직후 기분. 경로에 따라 문구 분기
//   full(환기까지) → 환기 마친 문구 / ball_only(공놀이만) → 공놀이 후 문구
export default function MoodPost() {
  const submit = useStore((s) => s.submitMoodPost)
  const postRoundType = useStore((s) => s.postRoundType)
  const title = postRoundType === 'full' ? MOOD_POST_RITUAL_TITLE : MOOD_POST_BALL_TITLE
  return <MoodScale title={title} onSubmit={submit} />
}
