import { useEffect, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../lib/apiClient'
import { getTaskHistory, toHistoryEntry, type HistoryEntry } from '../../lib/tasks'

const PAGE_SIZE = 20

export function HistoryPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    getTaskHistory({ limit: PAGE_SIZE })
      .then((page) => {
        setEntries(page.items.map(toHistoryEntry))
        setNextCursor(page.nextCursor)
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : '이력을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [])

  const loadMore = () => {
    if (!nextCursor) return
    setLoadingMore(true)
    getTaskHistory({ limit: PAGE_SIZE, cursor: nextCursor })
      .then((page) => {
        setEntries((prev) => [...prev, ...page.items.map(toHistoryEntry)])
        setNextCursor(page.nextCursor)
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : '이력을 불러오지 못했어요.'))
      .finally(() => setLoadingMore(false))
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">히스토리</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="검색"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <Search size={16} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-2 text-sm text-foreground transition-colors hover:bg-surface-raised"
          >
            필터 기준 전체
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            새 검색
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 px-2 text-sm text-muted">불러오는 중...</p>
      ) : loadError ? (
        <p className="mt-6 px-2 text-sm text-muted">{loadError}</p>
      ) : entries.length === 0 ? (
        <p className="mt-6 px-2 text-sm text-muted">아직 이력이 없어요.</p>
      ) : (
        <>
          <div className="mt-6 flex flex-col">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => navigate(`/chat/${entry.id}`)}
                className="flex items-center justify-between gap-4 border-b border-hairline px-2 py-3.5 text-left transition-colors hover:bg-surface-raised"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                  {entry.isCommand && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-accent-blue text-2xs font-semibold text-white">
                      /
                    </span>
                  )}
                  <span className="truncate">{entry.text}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{entry.timeLabel}</span>
              </button>
            ))}
          </div>

          {nextCursor && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-hairline px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-raised disabled:opacity-50"
              >
                {loadingMore ? '불러오는 중...' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
