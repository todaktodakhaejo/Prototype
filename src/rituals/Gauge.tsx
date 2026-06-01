// 의식 진행/세기 표시용 세로 게이지 (게임처럼). value 0~1을 그대로 높이로 반영.
// 컨테이너 '안쪽' 가장자리에 높은 zIndex로 두어 클리핑/스택 문제 없이 항상 보이게 한다.
export default function Gauge({
  value,
  from,
  to,
  side = 'right',
}: {
  value: number
  from: string
  to: string
  side?: 'left' | 'right'
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div
      style={{
        position: 'absolute',
        [side]: 8,
        top: 26,
        bottom: 26,
        width: 10,
        borderRadius: 999,
        background: 'rgba(20,16,30,0.35)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.45)',
        overflow: 'hidden',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${pct}%`,
          borderRadius: 999,
          background: `linear-gradient(0deg, ${from} 0%, ${to} 100%)`,
          boxShadow: `0 0 10px ${to}`,
          transition: 'height 0.08s linear',
        }}
      />
    </div>
  )
}
