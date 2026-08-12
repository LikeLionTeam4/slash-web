import { useState } from 'react'
import { SearchBar } from '../components/SearchBar'
import { useCurrentUser } from '../hooks/currentUserContext'
import { EXAMPLE_COMMANDS } from '../lib/exampleCommands'

export function HomePage() {
  const [preset, setPreset] = useState<{ path: string[]; operands: string[] } | undefined>(undefined)
  const { displayName } = useCurrentUser()
  const nameLabel = displayName ? `${displayName}님` : '고객님'

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold tracking-tight">무엇을 도와드릴까요, {nameLabel}?</h1>
      <p className="mt-3 text-muted">파일·웹 검색, 생성형 AI, PC 제어까지 한 번에.</p>

      <div className="mt-10 w-full">
        <SearchBar presetQuery={preset} />
      </div>

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
    </div>
  )
}
