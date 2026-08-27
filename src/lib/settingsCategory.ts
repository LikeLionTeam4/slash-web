import { User, Shield, CreditCard, BarChart2, Puzzle, Cog, FolderClosed } from 'lucide-react'

// 실제로 쓰는 카테고리(일반·파일·연동)만 앞에 두고, 아직 내용이 없는 나머지는 뒤로 몰아
// disabled로 표시한다 — 클릭해도 "준비 중이에요."만 보여주는 죽은 클릭을 없앤다.
export const SETTINGS_CATEGORIES = [
  { id: 'general', label: '일반', icon: Cog, disabled: false },
  { id: 'files', label: '파일', icon: FolderClosed, disabled: false },
  { id: 'plugins', label: '연동', icon: Puzzle, disabled: false },
  { id: 'account', label: '계정', icon: User, disabled: true },
  { id: 'privacy', label: '개인정보 보호', icon: Shield, disabled: true },
  { id: 'billing', label: '결제', icon: CreditCard, disabled: true },
  { id: 'usage', label: '사용량', icon: BarChart2, disabled: true },
] as const

export type SettingsCategoryId = (typeof SETTINGS_CATEGORIES)[number]['id']
export const DEFAULT_SETTINGS_CATEGORY: SettingsCategoryId = 'general'

export function isSettingsCategoryId(value: string): value is SettingsCategoryId {
  return SETTINGS_CATEGORIES.some((c) => c.id === value)
}
