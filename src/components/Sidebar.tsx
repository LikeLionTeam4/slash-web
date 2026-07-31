import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { PanelLeft, Plus, History, LayoutDashboard, Star, FolderClosed, Calendar, Command } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { ProfileMenu } from './ProfileMenu'
import { clearLogin, homePathForSession } from '../lib/auth'
import { RECENT_ENTRIES } from '../lib/mockHistory'
import { EMAIL } from '../lib/user'

const NAV_ITEMS: { icon: typeof History; label: string; path?: string }[] = [
  { icon: History, label: '히스토리', path: '/history' },
  { icon: LayoutDashboard, label: '대시보드', path: '/dashboard' },
  { icon: Star, label: '즐겨찾기' },
  { icon: FolderClosed, label: '파일' },
  { icon: Calendar, label: '일정' },
]

export function Sidebar({
  onOpenSettings,
  onOpenGuide,
  onOpenShortcuts,
}: {
  onOpenSettings: () => void
  onOpenGuide: () => void
  onOpenShortcuts: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-hairline bg-surface transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      <div className="flex items-center justify-between px-3 pt-4">
        {!collapsed && (
          <button
            type="button"
            onClick={() => navigate(homePathForSession())}
            className="-mx-1 flex items-center gap-2 rounded-[8px] px-2 py-1 text-control font-semibold transition-colors hover:bg-surface-raised"
          >
            <img src="/logo.png" alt="" className="h-6 w-6 rounded-[6px]" />
            Slash
          </button>
        )}
        <Tooltip label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}>
          <button
            aria-label="사이드바 접기/펼치기"
            onClick={() => setCollapsed((c) => !c)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-raised hover:text-foreground ${
              collapsed ? 'mx-auto' : ''
            }`}
          >
            <PanelLeft size={18} />
          </button>
        </Tooltip>
      </div>

      <div className="px-3 pt-4">
        <button
          type="button"
          onClick={() => navigate('/new')}
          className={`flex w-full items-center gap-2 rounded-lg bg-foreground/8 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/12 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Plus size={16} />
          {!collapsed && '새 채팅'}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pt-3">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const active = path !== undefined && location.pathname === path
          return (
            <button
              key={label}
              type="button"
              onClick={path ? () => navigate(path) : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? 'bg-foreground/8 text-foreground' : 'text-muted hover:bg-surface-raised hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon size={17} />
              {!collapsed && label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={onOpenGuide}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-raised hover:text-foreground ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Command size={17} />
          {!collapsed && '명령어 가이드'}
        </button>
      </nav>

      {collapsed ? (
        <div className="flex-1" />
      ) : (
        <div className="mt-4 flex-1 overflow-y-auto px-3">
          <p className="px-3 pb-1 text-xs font-medium text-muted">최근</p>
          <div className="flex flex-col gap-0.5">
            {RECENT_ENTRIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/chat/${item.id}`)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground/80 transition-colors hover:bg-surface-raised"
              >
                {item.isCommand && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-accent-blue text-2xs font-semibold text-white">
                    /
                  </span>
                )}
                <span className="truncate">{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileMenuOpen((o) => !o)}
          className={`flex w-full items-center gap-2.5 border-t border-hairline px-3 py-3 text-left transition-colors hover:bg-surface-raised ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-sm font-medium text-foreground">
            S
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Slash 사용자</p>
              <p className="text-xs text-muted">무료 플랜</p>
            </div>
          )}
        </button>

        {profileMenuOpen && (
          <ProfileMenu
            email={EMAIL}
            onOpenSettings={onOpenSettings}
            onOpenShortcuts={onOpenShortcuts}
            // 뒤로 가기로 로그인 전 화면에 되돌아가지 않도록 히스토리를 남기지 않는다.
            // TODO: 백엔드 연동 시 여기서 세션/토큰 정리도 함께 한다.
            onLogout={() => {
              clearLogin()
              navigate('/login', { replace: true })
            }}
            onClose={() => setProfileMenuOpen(false)}
          />
        )}
      </div>
    </aside>
  )
}
