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
  // 예시를 아예 숨긴다.
  const [searchActive, setSearchActive] = useState(false)

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight">무엇을 도와드릴까요, {nameLabel}?</h1>
      <p className="mt-3 text-muted">파일·웹 검색, 생성형 AI, PC 제어까지 한 번에.</p>

      <div className="mt-10 w-full">
        <SearchBar presetQuery={preset} onActiveChange={setSearchActive} />
      </div>

      {!searchActive && (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
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
      )}
    </div>
  )
}
