import { Search, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { HISTORY_ENTRIES } from '../../lib/mockHistory'

const STATS = [
  {
    icon: Search,
    badgeClassName: 'bg-accent-blue/14 text-accent-blue',
    label: '이번 주 웹 검색',
    value: 32,
    unit: '회',
  },
  {
    icon: Sparkles,
    badgeClassName: 'bg-accent-purple/14 text-accent-purple',
    label: '이번 주 AI 답변',
    value: 18,
    unit: '회',
  },
  {
    icon: ShieldCheck,
    badgeClassName: 'bg-accent-green/14 text-accent-green',
    label: '차단된 위험 요청',
    value: 0,
    unit: '건',
  },
] as const

export function DashboardPage() {
  const navigate = useNavigate()
  const recent = HISTORY_ENTRIES.slice(0, 5)

  return (
    <div className="w-full max-w-4xl">
      <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATS.map(({ icon: Icon, badgeClassName, label, value, unit }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-surface p-6 text-center"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${badgeClassName}`}>
              <Icon size={22} />
            </div>
            <p className="text-sm text-muted">{label}</p>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              {value}
              <span className="ml-1 text-base font-medium text-muted">{unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">최근 활동</h2>
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
          >
            전체 보기
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="mt-3 flex flex-col">
          {recent.map((entry, i) => (
            <div
              key={`${entry.text}-${i}`}
              className="flex items-center justify-between gap-4 border-b border-hairline px-2 py-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground">
                {entry.isCommand && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-accent-blue text-[10px] font-semibold text-white">
                    /
                  </span>
                )}
                <span className="truncate">{entry.text}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{entry.timeLabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
