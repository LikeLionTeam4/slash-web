import { useState } from 'react'
import { SearchBar } from '../components/SearchBar'
import { useCurrentUser } from '../hooks/currentUserContext'
import { EXAMPLE_COMMANDS } from '../lib/exampleCommands'

export function HomePage() {
  const [preset, setPreset] = useState<{ path: string[]; operands: string[] } | undefined>(undefined)
  const { displayName } = useCurrentUser()
  const nameLabel = displayName ? `${displayName}님` : '고객님'
  // 검색창 아래의 제안·힌트·결과 패널은 absolute 오버레이라 이 예시 칩을 밀어내지 않고 그 위에
  // 뜬다(SearchBar.tsx의 onActiveChange 주석 참고) — 겹치지 않도록 그 패널이 뜰 만한 상태에는
  // 예시를 숨긴다. 단, 언마운트(조건부 렌더)하면 이 블록 전체 높이가 줄어 justify-center가
  // 다시 계산되면서 검색창 자체가 위로 움직여버린다(2026-08-20, 되돌림) — 검색창 위치는 절대
  // 고정이어야 하므로 공간은 그대로 차지한 채 invisible로 숨긴다.
  const [searchActive, setSearchActive] = useState(false)

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
        <SearchBar presetQuery={preset} onActiveChange={setSearchActive} />
      </div>

      <div
        className={`mt-12 flex flex-wrap items-center justify-center gap-3 ${searchActive ? 'invisible' : ''}`}
      >
        {EXAMPLE_COMMANDS.map((cmd) => (
          <button
            key={cmd.path.join('/')}
            type="button"
            onClick={() => setPreset({ path: cmd.path, operands: cmd.operands })}
            className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-surface-raised"
          >
            <span>{cmd.icon}</span>
            <span>
              <span className="text-muted">/</span>
              {cmd.path.join('/')} <span className="text-muted">{cmd.operands.join(' ')}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
