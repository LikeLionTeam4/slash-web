// 대화 상세(`/chat/:id`)에 쓰는 목 대화들. 히스토리·최근·대시보드 목록이 전부 여기서 파생되므로
// (mockHistory.ts) 목록에 보이는 행은 반드시 열리는 대화를 갖는다 — 예전에는 목록과 대화 내용이
// 따로 놀아서 어느 행을 눌러도 같은 대화가 나왔다.
//
// 다섯 개를 케이스별로 하나씩 뒀다: 슬래시 명령 3개(웹 검색 / 파일 검색+다운로드 / 길찾기),
// 자연어 2개(코드 답변 / 파일 다운로드). 답변이 돌아오는 방식도 케이스마다 다르게 골랐다.
// 전부 목 데이터다 — 실제 API 응답이 아니다.

export type FileResult = { name: string; path: string }
/** 웹 검색 결과. 목 데이터라 링크로 만들지 않는다 — 없는 주소로 새 탭을 여는 것보다 낫다. */
export type WebResult = { title: string; domain: string; snippet: string }
/** 길찾기처럼 순서가 의미를 갖는 답변. */
export type RouteStep = { label: string; detail: string }
/** 실제로 내려받아지는 파일. content가 그대로 파일 내용이 된다(가짜 확장자를 붙이지 않는다). */
export type DownloadFile = { name: string; meta: string; mime: string; content: string }

export type AssistantContent =
  | { type: 'file-results'; items: FileResult[] }
  | { type: 'web-results'; items: WebResult[] }
  | { type: 'route-steps'; total: string; items: RouteStep[] }
  | { type: 'code'; language: string; code: string }
  | { type: 'download'; file: DownloadFile }

export type ThreadItem =
  | {
      role: 'user'
      text: string
      /** 슬래시 명령으로 물어본 경우 — 검색바와 같이 명령어와 값을 따로 들고 있다. */
      command?: { path: string[]; operands: string[] }
      attachment?: { name: string; meta: string; format: string }
    }
  | { role: 'assistant'; text: string; content?: AssistantContent }

export type Thread = {
  id: string
  /** 목록 행과 상세 화면 머리말에 함께 쓰는 한 줄. 명령 대화는 명령어 그대로다. */
  title: string
  isCommand: boolean
  timeLabel: string
  items: ThreadItem[]
}

const 견적서_비교_CSV = `파일명,수정일,금액(원),비고
견적서_최종.pdf,2026-07-28,12400000,발송 완료
견적서_수정본.xlsx,2026-07-21,11800000,단가 조정 전
견적서_초안.pdf,2026-07-14,11800000,내부 검토용
`

const 제주_코스_MD = `# 제주도 2박 3일 코스

## 1일차 — 동쪽
- 15:00 제주공항 도착, 렌터카 수령
- 16:30 함덕 해수욕장
- 18:30 저녁: 세화리 흑돼지
- 숙소: 성산 근처

## 2일차 — 남쪽
- 07:00 성산일출봉
- 10:00 섭지코지
- 13:00 점심: 표선 물회
- 15:00 카멜리아힐
- 18:00 저녁: 서귀포 매일올레시장

## 3일차 — 서쪽
- 09:00 오설록 티뮤지엄
- 11:00 협재 해수욕장
- 13:00 점심: 애월 고기국수
- 15:00 제주공항 반납

메모: 2일차 이동이 가장 길어요. 성산 숙소를 잡으면 아침 일출봉까지 10분입니다.
`

export const THREADS: Thread[] = [
  {
    id: '3efd142c-3d49-4445-910b-a154f8da3dd1',
    title: '/네이버 아이폰 16 가격',
    isCommand: true,
    timeLabel: '13시간 전',
    items: [
      { role: 'user', text: '아이폰 16 가격', command: { path: ['네이버'], operands: ['아이폰 16 가격'] } },
      {
        role: 'assistant',
        text: '네이버 통합검색 결과에서 가격이 실려 있는 문서만 추렸어요.\n출고가는 128GB 기준이고, 실구매가는 판매처마다 달라요.',
        content: {
          type: 'web-results',
          items: [
            {
              title: '아이폰 16 - 사양 및 가격',
              domain: 'apple.com',
              snippet: '아이폰 16 128GB 1,250,000원부터. 256GB 1,400,000원, 512GB 1,700,000원.',
            },
            {
              title: '아이폰 16 최저가 비교',
              domain: 'prod.danawa.com',
              snippet: '자급제 기준 최저 1,168,000원 (7월 28일 기준). 카드 할인 적용 시 추가 인하.',
            },
            {
              title: '통신사별 아이폰 16 지원금 정리',
              domain: 'blog.naver.com',
              snippet: '요금제별 공시지원금과 선택약정 25% 할인 중 어느 쪽이 유리한지 표로 비교했습니다.',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'f7cefac3-3a1e-4a57-a00c-5e40a0577fc1',
    title: '/파일 견적서',
    isCommand: true,
    timeLabel: '어제',
    items: [
      { role: 'user', text: '견적서', command: { path: ['파일'], operands: ['견적서'] } },
      {
        role: 'assistant',
        text: '선택한 폴더에서 이름에 "견적서"가 들어간 파일 3개를 찾았어요.',
        content: {
          type: 'file-results',
          items: [
            { name: '견적서_최종.pdf', path: 'Documents/2026' },
            { name: '견적서_수정본.xlsx', path: 'Documents/2026/보관' },
            { name: '견적서_초안.pdf', path: 'Documents/2026/보관' },
          ],
        },
      },
      { role: 'user', text: '세 개 금액만 뽑아서 표로 정리해줘' },
      {
        role: 'assistant',
        text: '금액과 수정일만 뽑아 표로 만들었어요. 최종본과 수정본 사이에 60만 원 차이가 있어요.',
        content: {
          type: 'download',
          file: {
            name: '견적서_비교.csv',
            meta: '3행 · 표 형식',
            mime: 'text/csv;charset=utf-8',
            content: 견적서_비교_CSV,
          },
        },
      },
    ],
  },
  {
    id: '399762aa-872d-4ab9-8f0a-68495b80c7c2',
    title: '/네이버/길찾기 강남역 홍대입구역',
    isCommand: true,
    timeLabel: '그저께',
    items: [
      {
        role: 'user',
        text: '강남역 → 홍대입구역',
        command: { path: ['네이버', '길찾기'], operands: ['강남역', '홍대입구역'] },
      },
      {
        role: 'assistant',
        text: '환승 없이 2호선으로 한 번에 갈 수 있어요.',
        content: {
          type: 'route-steps',
          total: '약 38분 · 환승 0회 · 1,400원',
          items: [
            { label: '강남역 승차', detail: '2호선 내선순환 (사당 방면) · 4-2 승강장' },
            { label: '19개 역 이동', detail: '교대 · 사당 · 신림 · 구로디지털단지 · 신도림 · 당산 · 합정' },
            { label: '홍대입구역 하차', detail: '9번 출구 · 도보 2분이면 걷고싶은거리' },
          ],
        },
      },
    ],
  },
  {
    id: 'b46aa0a5-9630-4436-a392-3006503e4a0f',
    title: 'Kubernetes 파드가 자꾸 재시작되는 이유',
    isCommand: false,
    timeLabel: '3일 전',
    items: [
      { role: 'user', text: 'Kubernetes 파드가 자꾸 재시작되는 이유' },
      {
        role: 'assistant',
        text: '재시작이 반복될 때 원인은 대개 셋 중 하나예요.\n\n1. 메모리 한도 초과 — 컨테이너가 limits.memory를 넘기면 OOMKilled로 죽고 바로 재시작됩니다.\n2. 라이브니스 프로브 실패 — 앱이 뜨는 데 걸리는 시간보다 initialDelaySeconds가 짧으면, 정상인 파드를 계속 죽입니다.\n3. 시작 직후 크래시 — 설정이나 의존 서비스 문제로 프로세스가 즉시 종료되면 CrashLoopBackOff가 됩니다.\n\n어느 쪽인지는 종료 코드로 갈립니다. 137이면 1번이에요.',
        content: {
          type: 'code',
          language: 'bash',
          code: `# 마지막으로 죽은 이유와 종료 코드 확인
kubectl describe pod <pod> | grep -A5 "Last State"

# 죽기 직전 로그 (재시작 이전 컨테이너)
kubectl logs <pod> --previous

# 메모리 한도에 얼마나 붙어 있었는지
kubectl top pod <pod>`,
        },
      },
    ],
  },
  {
    id: '29022818-1eb4-49e2-861a-55ab62d890d3',
    title: '제주도 2박 3일 여행 코스 짜줘',
    isCommand: false,
    timeLabel: '5일 전',
    items: [
      { role: 'user', text: '제주도 2박 3일 여행 코스 짜줘' },
      {
        role: 'assistant',
        text: '동선이 겹치지 않게 하루에 한 방향씩 도는 코스로 짰어요.\n첫날 동쪽, 둘째 날 남쪽, 마지막 날 서쪽으로 돌면 공항으로 자연스럽게 돌아옵니다.\n\n파일로 정리해뒀으니 받아서 일정에 붙여넣어도 돼요.',
        content: {
          type: 'download',
          file: {
            name: '제주도_2박3일_코스.md',
            meta: '3일치 · 마크다운',
            mime: 'text/markdown;charset=utf-8',
            content: 제주_코스_MD,
          },
        },
      },
    ],
  },
]

export function findThread(id: string | undefined): Thread | null {
  return THREADS.find((t) => t.id === id) ?? null
}
