// Static slash-command tree for the discovery/autocomplete dropdown (type "/" to browse).

export type CommandNode = {
  id: string
  label: string
  description: string
  children?: CommandNode[]
}

export const COMMAND_TREE: CommandNode[] = [
  {
    id: '파일',
    label: '파일',
    description: '내 파일 관련 명령',
    children: [
      { id: '검색', label: '검색', description: '선택한 폴더에서 파일 이름으로 검색' },
      { id: '휴지통', label: '휴지통', description: '삭제한 파일 보기 · 복원 · 완전 삭제' },
      { id: '기타기능', label: '기타기능', description: '준비 중이에요' },
    ],
  },
  { id: '모델', label: '모델', description: '답변에 사용할 AI 모델 선택' },
  // Action-first (2026-07-30): 날씨/검색/지도/길찾기는 특정 서비스 고유 기능이 아니라
  // 네이버·구글 등 여러 서비스가 똑같이 제공할 수 있는 범용 액션이라, 액션을 상위로 두고
  // 그 아래에 "누가 해줄지"를 고른다. 파일/모델처럼 그 도메인만의 고유 기능은 도메인이 상위 그대로.
  {
    id: '검색',
    label: '검색',
    description: '웹 검색을 어디로 할지 선택',
    children: [
      { id: '네이버', label: '네이버', description: '네이버 통합검색' },
      { id: '구글', label: '구글', description: '구글 검색' },
    ],
  },
  {
    id: '날씨',
    label: '날씨',
    description: '날씨를 어디로 확인할지 선택',
    children: [{ id: '네이버', label: '네이버', description: '네이버 날씨' }],
  },
  {
    id: '지도',
    label: '지도',
    description: '지도를 어디로 볼지 선택',
    children: [{ id: '네이버', label: '네이버', description: '네이버 지도' }],
  },
  {
    id: '길찾기',
    label: '길찾기',
    description: '길찾기를 어디로 할지 선택',
    children: [{ id: '네이버', label: '네이버', description: '네이버 길찾기' }],
  },
]

export type Suggestions = { pathIds: string[]; options: CommandNode[] }

/** Returns the command-tree options matching what's typed after the last "/", or null if nothing matches. */
export function getSuggestions(value: string): Suggestions | null {
  if (!value.startsWith('/') || value.includes(' ')) return null

  const segments = value.slice(1).split('/')
  let nodes = COMMAND_TREE

  for (let i = 0; i < segments.length - 1; i++) {
    const match = nodes.find((n) => n.id === segments[i])
    if (!match?.children) return null
    nodes = match.children
  }

  const filterText = segments[segments.length - 1]
  const options = nodes.filter((n) => n.id.startsWith(filterText))
  return options.length > 0 ? { pathIds: segments.slice(0, -1), options } : null
}
