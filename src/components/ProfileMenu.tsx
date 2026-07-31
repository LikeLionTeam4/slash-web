import { useState, type ReactNode } from 'react'
import {
  Settings,
  Globe,
  CircleHelp,
  ArrowUpCircle,
  Download,
  Gift,
  ChevronRight,
  ExternalLink,
  Keyboard,
  LogOut,
} from 'lucide-react'

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <span className="flex shrink-0 gap-1">
      {keys.map((k) => (
        <span
          key={k}
          className="flex h-5 min-w-[20px] items-center justify-center rounded-[6px] bg-foreground/8 px-1 font-mono text-2xs text-muted"
        >
          {k}
        </span>
      ))}
    </span>
  )
}

function MenuItem({
  icon: Icon,
  label,
  trailing,
  onClick,
}: {
  icon: typeof Settings
  label: string
  trailing?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/8"
    >
      <Icon size={16} className="shrink-0 text-muted" />
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  )
}

const LEARN_MORE_ITEMS = ['Slash에 대하여', '튜토리얼', '강의', '이용 정책', '개인정보 처리방침', '이용약관', '개인정보 선택사항']

export function ProfileMenu({
  email,
  onOpenSettings,
  onOpenShortcuts,
  onLogout,
  onClose,
}: {
  email: string
  onOpenSettings: () => void
  onOpenShortcuts: () => void
  onLogout: () => void
  onClose: () => void
}) {
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-full left-0 z-50 mb-2 w-[280px] overflow-hidden rounded-xl border border-hairline bg-surface-raised py-1 text-left shadow-2xl">
        <p className="truncate px-3 py-2 text-sm text-muted">{email}</p>

        <div className="border-t border-hairline py-1">
          <MenuItem
            icon={Settings}
            label="설정"
            trailing={<KeyCombo keys={['⌘', ',']} />}
            onClick={() => {
              onOpenSettings()
              onClose()
            }}
          />
          <MenuItem icon={Globe} label="언어" onClick={onClose} />
          <MenuItem icon={CircleHelp} label="도움 받기" onClick={onClose} />
        </div>

        <div className="border-t border-hairline py-1">
          <MenuItem icon={ArrowUpCircle} label="요금제 업그레이드" onClick={onClose} />
          <MenuItem icon={Download} label="앱 및 확장 프로그램 받기" onClick={onClose} />
          <MenuItem icon={Gift} label="Slash 선물하기" onClick={onClose} />
        </div>

        <div
          className="relative border-t border-hairline py-1"
          onMouseEnter={() => setLearnMoreOpen(true)}
          onMouseLeave={() => setLearnMoreOpen(false)}
        >
          <button
            type="button"
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors ${
              learnMoreOpen ? 'bg-foreground/8' : ''
            }`}
          >
            <span className="flex-1">자세히 알아보기</span>
            <ChevronRight size={14} className="shrink-0 text-muted" />
          </button>

          {learnMoreOpen && (
            <div className="absolute bottom-0 left-full z-50 ml-2 w-64 overflow-hidden rounded-xl border border-hairline bg-surface-raised py-1 shadow-2xl">
              {LEARN_MORE_ITEMS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={onClose}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/8"
                >
                  <span className="flex-1">{label}</span>
                  <ExternalLink size={13} className="shrink-0 text-muted" />
                </button>
              ))}
              <div className="my-1 border-t border-hairline" />
              <button
                type="button"
                onClick={() => {
                  onOpenShortcuts()
                  onClose()
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/8"
              >
                <Keyboard size={15} className="shrink-0 text-muted" />
                <span className="flex-1">단축키</span>
                <KeyCombo keys={['⌘', '/']} />
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-hairline pt-1">
          <MenuItem
            icon={LogOut}
            label="로그아웃"
            onClick={() => {
              onClose()
              onLogout()
            }}
          />
        </div>
      </div>
    </>
  )
}
