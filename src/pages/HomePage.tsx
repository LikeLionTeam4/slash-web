import { SearchBar } from '../components/SearchBar'
import { useCurrentUser } from '../hooks/currentUserContext'

export function HomePage() {
  const { displayName } = useCurrentUser()
  const nameLabel = displayName ? `${displayName}님` : '고객님'

  return (
    // justify-center는 뺐다(2026-08-20) — Shift+Enter로 입력창이 여러 줄로 늘어나면 이 블록의
    // 총 높이가 바뀌고, justify-center가 그때마다 다시 중앙정렬하면서 헤딩·검색창이 통째로 위로
    // 움직였다. 입력창이 "세로로 늘어나는 건" 괜찮지만 "위치 자체가 바뀌는 건" 안 된다는 요청에
    // 따라, 고정된 위쪽 여백(pt)으로 자리를 잡고 늘어나는 만큼은 아래로만 밀리게 한다 — 화면이
    // 아주 작지 않은 한 이전의 "가운데쯤" 느낌과 크게 다르지 않다.
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center pt-[15vh] text-center">
      <h1 className="text-4xl font-bold tracking-tight">무엇을 도와드릴까요, {nameLabel}?</h1>
      <p className="mt-3 text-muted">파일·웹 검색, 생성형 AI, PC 제어까지 한 번에.</p>

      <div className="mt-10 w-full">
        <SearchBar />
      </div>
    </div>
  )
}
