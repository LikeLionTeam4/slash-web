import { X, User, Shield, CreditCard, BarChart2, Puzzle, Cog, Monitor, Sun, Moon, ChevronDown } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

const CATEGORIES = [
  { id: 'general', label: '일반', icon: Cog },
  { id: 'account', label: '계정', icon: User },
  { id: 'privacy', label: '개인정보 보호', icon: Shield },
  { id: 'billing', label: '결제', icon: CreditCard },
  { id: 'usage', label: '사용량', icon: BarChart2 },
  { id: 'plugins', label: '연동', icon: Puzzle },
] as const

export type SettingsCategoryId = (typeof CATEGORIES)[number]['id']
export const DEFAULT_SETTINGS_CATEGORY: SettingsCategoryId = 'general'

export function isSettingsCategoryId(value: string): value is SettingsCategoryId {
  return CATEGORIES.some((c) => c.id === value)
}

const APPEARANCE_OPTIONS: { id: Theme; icon: typeof Monitor; label: string }[] = [
  { id: 'system', icon: Monitor, label: '시스템' },
  { id: 'light', icon: Sun, label: '라이트' },
  { id: 'dark', icon: Moon, label: '다크' },
]

export function SettingsDialog({
  theme,
  onThemeChange,
  active,
  onActiveChange,
  onClose,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  active: SettingsCategoryId
  onActiveChange: (id: SettingsCategoryId) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(640px,85vh)] w-full max-w-3xl overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-48 shrink-0 space-y-0.5 border-r border-hairline p-2">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onActiveChange(id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                active === id
                  ? 'bg-foreground/10 text-foreground'
                  : 'text-muted hover:bg-foreground/6 hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 overflow-y-auto p-6">
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute right-4 top-4 text-muted transition-colors hover:text-foreground"
          >
            <X size={18} />
          </button>

          {active === 'general' ? (
            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-semibold">프로필</h2>

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground/10 text-lg font-medium">
                S
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted">성명</span>
                <input
                  defaultValue="Slash 사용자"
                  className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-foreground focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted">Slash가 어떻게 불러드릴까요?</span>
                <input
                  placeholder="닉네임"
                  className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-foreground placeholder:text-muted focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-muted">Slash 지침</span>
                <textarea
                  rows={3}
                  placeholder="예: 답변을 간단명료하게 유지"
                  className="resize-none rounded-lg border border-hairline bg-canvas px-3 py-2 text-foreground placeholder:text-muted focus:outline-none"
                />
              </label>

              <div className="border-t border-hairline pt-5">
                <h3 className="mb-3 text-sm font-semibold">환경설정</h3>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted">모양</span>
                  <div className="flex gap-1 rounded-lg border border-hairline p-1">
                    {APPEARANCE_OPTIONS.map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        type="button"
                        aria-label={label}
                        onClick={() => onThemeChange(id)}
                        className={`flex h-7 w-9 items-center justify-center rounded-[8px] transition-colors ${
                          theme === id ? 'bg-foreground/12 text-foreground' : 'text-muted hover:text-foreground'
                        }`}
                      >
                        <Icon size={15} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted">검색 결과 글꼴</span>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-sm text-foreground"
                  >
                    Pretendard
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              준비 중이에요.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
