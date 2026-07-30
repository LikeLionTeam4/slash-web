// Everyday, non-technical slash-command examples (네이버 날씨/지도/검색/길찾기, 파일 검색) — shown as
// suggestion chips on the home screen and mirrored in the sidebar's mock "최근" history, so both
// visibly point at the same real commands from commandTree.ts.
export type ExampleCommand = {
  icon: string
  path: string[]
  query: string
}

export const EXAMPLE_COMMANDS: ExampleCommand[] = [
  { icon: '☁️', path: ['네이버', '날씨'], query: '서울 날씨' },
  { icon: '🍜', path: ['네이버', '지도'], query: '강남역 맛집' },
  { icon: '🔍', path: ['네이버'], query: '아이폰 16 가격' },
  { icon: '🧭', path: ['네이버', '길찾기'], query: '강남역에서 홍대입구역' },
  { icon: '📄', path: ['파일'], query: '견적서.pdf' },
]

export function exampleCommandText(cmd: ExampleCommand): string {
  return `/${cmd.path.join('/')} ${cmd.query}`
}
