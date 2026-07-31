import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Sidebar } from './Sidebar'
import { SettingsDialog, DEFAULT_SETTINGS_CATEGORY, isSettingsCategoryId } from './SettingsDialog'
import { CommandGuideDialog } from './CommandGuideDialog'
import { ShortcutsDialog } from './ShortcutsDialog'
import { useTheme } from '../hooks/useTheme'
import { useFontSize } from '../hooks/useFontSize'

const SETTINGS_HASH_PREFIX = '#settings/'
const GUIDE_HASH = '#guide'
const SHORTCUTS_HASH = '#shortcuts'

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme()
  const { fontSize, setFontSize } = useFontSize()
  const location = useLocation()
  const navigate = useNavigate()

  const settingsCategoryRaw = location.hash.startsWith(SETTINGS_HASH_PREFIX)
    ? location.hash.slice(SETTINGS_HASH_PREFIX.length)
    : null
  const settingsOpen = settingsCategoryRaw !== null
  const settingsCategory =
    settingsCategoryRaw && isSettingsCategoryId(settingsCategoryRaw)
      ? settingsCategoryRaw
      : DEFAULT_SETTINGS_CATEGORY

  const openSettings = () =>
    navigate({ pathname: location.pathname, hash: `${SETTINGS_HASH_PREFIX}${DEFAULT_SETTINGS_CATEGORY}` })
  const closeSettings = () => navigate({ pathname: location.pathname }, { replace: true })
  const changeSettingsCategory = (id: string) =>
    navigate({ pathname: location.pathname, hash: `${SETTINGS_HASH_PREFIX}${id}` }, { replace: true })

  const guideOpen = location.hash === GUIDE_HASH
  const openGuide = () => navigate({ pathname: location.pathname, hash: GUIDE_HASH })
  const closeGuide = () => navigate({ pathname: location.pathname }, { replace: true })

  const shortcutsOpen = location.hash === SHORTCUTS_HASH
  const openShortcuts = () => navigate({ pathname: location.pathname, hash: SHORTCUTS_HASH })
  const closeShortcuts = () => navigate({ pathname: location.pathname }, { replace: true })

  return (
    <div className="flex h-screen font-sans text-foreground">
      <Sidebar onOpenSettings={openSettings} onOpenGuide={openGuide} onOpenShortcuts={openShortcuts} />
      <main className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-8">{children}</main>
      {settingsOpen && (
        <SettingsDialog
          theme={theme}
          onThemeChange={setTheme}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          active={settingsCategory}
          onActiveChange={changeSettingsCategory}
          onClose={closeSettings}
        />
      )}
      {guideOpen && <CommandGuideDialog onClose={closeGuide} />}
      {shortcutsOpen && <ShortcutsDialog onClose={closeShortcuts} />}
    </div>
  )
}
