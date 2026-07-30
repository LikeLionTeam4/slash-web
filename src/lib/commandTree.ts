// Static slash-command tree for the discovery/autocomplete dropdown (type "/" to browse).

export type CommandNode = {
  id: string
  label: string
  description: string
  children?: CommandNode[]
  /**
   * 이 명령이 받는 값들의 이름. 하나라도 있으면 `/명령` 뒤에 공백을 치는 순간 명령어는 칩으로
   * 빠지고 입력창은 값만 받는다 — 명령어와 검색어를 한 문자열로 섞지 않기 위해서다(백엔드에도
   * 둘을 따로 보낸다). 값이 둘 이상이면 Enter마다 한 값씩 확정한다(`/네이버/길찾기`).
   * 값을 받지 않는 명령(`/모델`, `/파일/휴지통` 같은 패널)은 이 필드가 없다.
   */
  operands?: string[]
}

// Flattened (2026-07-30, later): "/" already implies "search", so a literal "검색" segment was
// redundant everywhere it appeared. /파일/검색 → /파일 (파일's only other action, 휴지통, stays an
// explicit child). /검색/네이버 and /날씨·/지도·/길찾기 under 네이버 collapsed into one 네이버 node —
// bare /네이버 is search, and 날씨/지도/길찾기 are its children — since a service (네이버) always
// means the same thing wherever it appears, unlike the old tree where "네이버" was sometimes the
// top-level trigger and sometimes a child, depending on position. 구글 only ever searches, so it's
// a bare leaf with no children needed.
export const COMMAND_TREE: CommandNode[] = [
  {
    id: '파일',
    label: '파일',
    description: '선택한 폴더에서 파일 이름으로 검색',
    operands: ['파일 이름'],
    children: [
      { id: '휴지통', label: '휴지통', description: '삭제한 파일 보기 · 복원 · 완전 삭제' },
      { id: '기타기능', label: '기타기능', description: '준비 중이에요' },
    ],
  },
  { id: '모델', label: '모델', description: '답변에 사용할 AI 모델 선택' },
  {
    id: '네이버',
    label: '네이버',
    description: '네이버 통합검색',
    operands: ['검색어'],
    children: [
      { id: '날씨', label: '날씨', description: '네이버 날씨', operands: ['지역'] },
      { id: '지도', label: '지도', description: '네이버 지도', operands: ['장소'] },
      { id: '길찾기', label: '길찾기', description: '네이버 길찾기', operands: ['출발지', '도착지'] },
    ],
  },
  { id: '구글', label: '구글', description: '구글 검색', operands: ['검색어'] },
]

/** 경로(`['네이버','지도']`)에 해당하는 노드. 중간에 끊기면 null. */
export function findCommand(pathIds: string[]): CommandNode | null {
  let nodes = COMMAND_TREE
  let found: CommandNode | null = null

  for (const id of pathIds) {
    const match = nodes.find((n) => n.id === id)
    if (!match) return null
    found = match
    nodes = match.children ?? []
  }
  return found
}

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
