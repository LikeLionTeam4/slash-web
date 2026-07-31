import { useMemo, useRef } from 'react'
import { X, User, Shield, CreditCard, BarChart2, Puzzle, Cog, Monitor, Sun, Moon, ChevronDown, FolderClosed } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import type { FontSize } from '../hooks/useFontSize'
import { useFileSearch } from '../hooks/fileSearchContext'
import { getClientInfo } from '../lib/clientInfo'

const CATEGORIES = [
  { id: 'general', label: '일반', icon: Cog },
  { id: 'files', label: '파일', icon: FolderClosed },
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

// 모양은 아이콘만으로 뜻이 통하지만 크기는 그렇지 않아 글자 라벨을 쓴다. 라벨 자체도 함께
// 커지므로 고른 결과가 그 자리에서 바로 보인다.
const FONT_SIZE_OPTIONS: { id: FontSize; label: string }[] = [
  { id: 'normal', label: '보통' },
  { id: 'large', label: '크게' },
  { id: 'x-large', label: '매우 크게' },
]

const CLIENT_INFO_ROWS: { key: keyof ReturnType<typeof getClientInfo>; label: string }[] = [
  { key: 'timeZone', label: '타임존' },
  { key: 'os', label: '운영체제' },
  { key: 'browser', label: '브라우저' },
  { key: 'language', label: '언어' },
  { key: 'resolution', label: '화면 해상도' },
]

// 브라우저가 스스로 아는 값을 참고용으로 보여주는 자리. 표시 전용이라 여기서 값을 바꿀 방법은 없다 —
// 실제 동작을 이 값에 따라 바꿔야 한다면 백엔드가 요청 헤더로 별도 판단해야 한다 (src/lib/clientInfo.ts).
function ClientInfo() {
  const info = useMemo(() => getClientInfo(), [])

  return (
    <>
      <h3 className="mb-1 text-sm font-semibold">이 기기</h3>
      <p className="mb-3 text-xs text-muted">브라우저가 알려주는 값이에요 — 참고용으로만 보여드려요.</p>
      <div className="flex flex-col">
        {CLIENT_INFO_ROWS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between border-b border-hairline py-2 last:border-b-0">
            <span className="text-sm text-muted">{label}</span>
            <span className="text-sm text-foreground">{info[key]}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * `/파일` 검색이 뒤질 폴더를 미리 정해두는 곳. 검색할 때마다 폴더를 고르게 하면 검색 한 번에
 * 두 가지 결정(어디서 · 무엇을)을 하게 되므로, 잘 안 바뀌는 쪽인 "어디서"를 설정으로 옮겼다.
 */
function SearchFolders() {
  const fileSearch = useFileSearch()
  const readOnlyInputRef = useRef<HTMLInputElement>(null)
  const hasFolders = fileSearch.folders.length > 0 || fileSearch.readOnlyFolders.length > 0

  return (
    <>
      {/* webkitdirectory는 JSX 타입에 없어 ref로 직접 건다. showDirectoryPicker와 달리 이 옛 API에는
          "민감한 폴더" 차단 목록이 없어서, 다운로드 같은 최상위 폴더에 닿는 유일한 방법이다(읽기 전용). */}
      <input
        ref={(el) => {
          readOnlyInputRef.current = el
          el?.setAttribute('webkitdirectory', '')
        }}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) fileSearch.addReadOnlyFolder(e.target.files)
          e.target.value = ''
        }}
      />

      <h3 className="mb-1 text-sm font-semibold">파일 검색 폴더</h3>
      <p className="mb-3 text-xs text-muted">
        여기에 추가한 폴더에서만 <code className="text-foreground">/파일</code> 검색이 이뤄져요.
      </p>

      {!fileSearch.supported ? (
        <p className="text-sm text-muted">이 브라우저는 로컬 폴더 접근을 지원하지 않아요 (Chrome/Edge 권장).</p>
      ) : (
        <>
          {hasFolders && (
            <div className="mb-3 flex flex-col gap-1.5">
              {fileSearch.folders.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm"
                >
                  <FolderClosed size={15} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-foreground">{f.name}</span>
                  {!f.connected && (
                    <button
                      type="button"
                      onClick={() => fileSearch.reconnectFolder(f.name)}
                      className="shrink-0 text-xs font-medium text-accent-blue transition-colors hover:brightness-110"
                    >
                      재연결
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`${f.name} 제거`}
                    onClick={() => fileSearch.removeFolder(f.name)}
                    className="shrink-0 text-muted transition-colors hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {fileSearch.readOnlyFolders.map((f) => (
                <div
                  key={f.name}
                  title="읽기 전용 — 삭제할 수 없고, 새로고침하면 다시 추가해야 해요"
                  className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm"
                >
                  <FolderClosed size={15} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1 truncate text-muted">{f.name} (읽기 전용)</span>
                  <button
                    type="button"
                    aria-label={`${f.name} 제거`}
                    onClick={() => fileSearch.removeReadOnlyFolder(f.name)}
                    className="shrink-0 text-muted transition-colors hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fileSearch.addFolder}
              className="rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
            >
              폴더 추가
            </button>
            <button
              type="button"
              onClick={() => readOnlyInputRef.current?.click()}
              title="다운로드처럼 최상위 폴더 자체는 읽기 전용으로만 추가할 수 있어요"
              className="text-xs font-medium text-muted transition-colors hover:text-accent-blue"
            >
              최상위 폴더 (읽기 전용)
            </button>
          </div>

          <p className="mt-2 text-xs text-muted">
            홈 폴더·바탕화면·다운로드 같은 최상위 폴더는 브라우저가 막아요 — 그 안의 구체적인 하위 폴더들을 여러 개
            추가해보세요.
          </p>
          {fileSearch.error && <p className="mt-1 text-xs text-accent-blue">{fileSearch.error}</p>}
        </>
      )}
    </>
  )
}

export function SettingsDialog({
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  active,
  onActiveChange,
  onClose,
}: {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  fontSize: FontSize
  onFontSizeChange: (size: FontSize) => void
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
                  <span className="text-sm text-muted">글씨 크기</span>
                  <div className="flex gap-1 rounded-lg border border-hairline p-1">
                    {FONT_SIZE_OPTIONS.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onFontSizeChange(id)}
                        className={`rounded-[8px] px-3 py-1 text-sm transition-colors ${
                          fontSize === id ? 'bg-foreground/12 text-foreground' : 'text-muted hover:text-foreground'
                        }`}
                      >
                        {label}
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

              <div className="mt-6 border-t border-hairline pt-5">
                <ClientInfo />
              </div>
            </div>
          ) : active === 'files' ? (
            <div className="flex flex-col gap-6">
              <SearchFolders />
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
