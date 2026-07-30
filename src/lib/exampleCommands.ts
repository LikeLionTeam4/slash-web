// Everyday, non-technical slash-command examples (네이버 날씨/지도/검색/길찾기, 파일 검색) — shown as
// suggestion chips on the home screen and mirrored in the sidebar's mock "최근" history, so both
// visibly point at the same real commands from commandTree.ts.
export type ExampleCommand = {
  /**
   * 이 예시가 남긴 목 대화의 id (`/chat/:id`). 사이드바 "최근"과 히스토리에서 같은 항목을 눌렀을
   * 때 같은 대화로 가야 하므로 한곳에서 정한다. 하드코딩된 이유는 `crypto.randomUUID()`로 만들면
   * 새로고침마다 값이 바뀌어 `/chat/<id>` 링크가 곧바로 죽기 때문이다.
   */
  id: string
  icon: string
  path: string[]
  /** 명령어가 받는 값들 — commandTree의 `operands`와 같은 순서다(`/네이버/길찾기`는 출발지, 도착지). */
  operands: string[]
}

export const EXAMPLE_COMMANDS: ExampleCommand[] = [
  { id: '5bc2dc4e-96b2-4f06-bed0-059d2dbf66e4', icon: '☁️', path: ['네이버', '날씨'], operands: ['서울 날씨'] },
  { id: '4a760c68-ace2-49df-a244-1ec2d179e065', icon: '🍜', path: ['네이버', '지도'], operands: ['강남역 맛집'] },
  { id: '3efd142c-3d49-4445-910b-a154f8da3dd1', icon: '🔍', path: ['네이버'], operands: ['아이폰 16 가격'] },
  { id: '399762aa-872d-4ab9-8f0a-68495b80c7c2', icon: '🧭', path: ['네이버', '길찾기'], operands: ['강남역', '홍대입구역'] },
  { id: 'f7cefac3-3a1e-4a57-a00c-5e40a0577fc1', icon: '📄', path: ['파일'], operands: ['견적서.pdf'] },
]

export function exampleCommandText(cmd: ExampleCommand): string {
  return `/${cmd.path.join('/')} ${cmd.operands.join(' ')}`
}
