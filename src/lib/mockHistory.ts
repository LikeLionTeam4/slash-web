import { EXAMPLE_COMMANDS, exampleCommandText } from './exampleCommands'

/** `id`는 `/chat/:id`로 이동할 때 쓴다 — 고정값인 이유는 exampleCommands.ts의 주석 참고. */
export type HistoryEntry = { id: string; text: string; isCommand: boolean; timeLabel: string }

const COMMAND_TIME_LABELS = ['13시간 전', '14시간 전', '어제', '그저께', '3일 전']

const COMMAND_ENTRIES: HistoryEntry[] = EXAMPLE_COMMANDS.map(
  (cmd, i): HistoryEntry => ({
    id: cmd.id,
    text: exampleCommandText(cmd),
    isCommand: true,
    timeLabel: COMMAND_TIME_LABELS[i] ?? '3일 전',
  }),
)

const FREE_TEXT_ENTRIES: HistoryEntry[] = [
  {
    id: 'b46aa0a5-9630-4436-a392-3006503e4a0f',
    text: 'Kubernetes 파드가 자꾸 재시작되는 이유',
    isCommand: false,
    timeLabel: '어제',
  },
  {
    id: '92271dac-58e7-4294-bbc9-eef7a2b888b4',
    text: 'Spring Boot 환경변수 설정 방법',
    isCommand: false,
    timeLabel: '그저께',
  },
  {
    id: 'caab0e1f-b937-43a8-8957-136ed8c8862b',
    text: '요즘 뜨는 넷플릭스 드라마 추천해줘',
    isCommand: false,
    timeLabel: '3일 전',
  },
  {
    id: '158ecd17-c7ac-4150-84df-f6770a886136',
    text: '면접 예상 질문 정리해줘',
    isCommand: false,
    timeLabel: '4일 전',
  },
  {
    id: '29022818-1eb4-49e2-861a-55ab62d890d3',
    text: '제주도 2박 3일 여행 코스 짜줘',
    isCommand: false,
    timeLabel: '5일 전',
  },
]

export const HISTORY_ENTRIES: HistoryEntry[] = [...COMMAND_ENTRIES, ...FREE_TEXT_ENTRIES]

/**
 * 사이드바 "최근"에 보여줄 부분집합 — 명령어 예시 전부 + 자연어 질문 두 개라 두 검색 모드가
 * 나란히 보인다. 히스토리와 같은 배열에서 뽑으므로 같은 항목은 양쪽에서 같은 id를 갖는다.
 */
export const RECENT_ENTRIES: HistoryEntry[] = [...COMMAND_ENTRIES, ...FREE_TEXT_ENTRIES.slice(2, 4)]
