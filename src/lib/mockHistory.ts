import { EXAMPLE_COMMANDS, exampleCommandText } from './exampleCommands'

export type HistoryEntry = { text: string; isCommand: boolean; timeLabel: string }

const COMMAND_TIME_LABELS = ['13시간 전', '14시간 전', '어제', '그저께', '3일 전']

export const HISTORY_ENTRIES: HistoryEntry[] = [
  ...EXAMPLE_COMMANDS.map(
    (cmd, i): HistoryEntry => ({
      text: exampleCommandText(cmd),
      isCommand: true,
      timeLabel: COMMAND_TIME_LABELS[i] ?? '3일 전',
    }),
  ),
  { text: 'Kubernetes 파드가 자꾸 재시작되는 이유', isCommand: false, timeLabel: '어제' },
  { text: 'Spring Boot 환경변수 설정 방법', isCommand: false, timeLabel: '그저께' },
  { text: '요즘 뜨는 넷플릭스 드라마 추천해줘', isCommand: false, timeLabel: '3일 전' },
  { text: '면접 예상 질문 정리해줘', isCommand: false, timeLabel: '4일 전' },
  { text: '제주도 2박 3일 여행 코스 짜줘', isCommand: false, timeLabel: '5일 전' },
]
