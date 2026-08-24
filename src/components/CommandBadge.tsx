/** 히스토리·최근·대시보드 목록에서 어떤 명령(taskType)의 결과인지 보여주는 배지. label이 없으면
 *  자유입력이거나 아직 분류되지 않은 항목이라 아무것도 렌더링하지 않는다. */
export function CommandBadge({ label }: { label: string | null }) {
  if (!label) return null
  return (
    <span className="shrink-0 rounded-full bg-accent-blue/12 px-2 py-0.5 text-2xs font-medium text-accent-blue">
      /{label}
    </span>
  )
}
