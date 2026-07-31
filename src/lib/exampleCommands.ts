// Everyday, non-technical slash-command examples (네이버 날씨/지도/검색/길찾기, 파일 검색) — 홈 화면의
// 추천 칩으로 쓴다. commandTree.ts에 실제로 등록된 명령만 올린다.
// 히스토리·최근 목록은 여기서 만들지 않는다 — 지난 대화는 목 대화(mockThreads.ts)에서 나온다.
export type ExampleCommand = {
  icon: string
  path: string[]
  /** 명령어가 받는 값들 — commandTree의 `operands`와 같은 순서다(`/네이버/길찾기`는 출발지, 도착지). */
  operands: string[]
}

export const EXAMPLE_COMMANDS: ExampleCommand[] = [
  { icon: '☁️', path: ['네이버', '날씨'], operands: ['서울 날씨'] },
  { icon: '🍜', path: ['네이버', '지도'], operands: ['강남역 맛집'] },
  { icon: '🔍', path: ['네이버'], operands: ['아이폰 16 가격'] },
  { icon: '🧭', path: ['네이버', '길찾기'], operands: ['강남역', '홍대입구역'] },
  { icon: '📄', path: ['파일'], operands: ['견적서.pdf'] },
]
