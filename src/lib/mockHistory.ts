import { THREADS } from '../features/chat/mockThreads'

/**
 * 히스토리·최근·대시보드가 함께 쓰는 목록. 목 대화(mockThreads.ts)에서 그대로 파생시킨다 —
 * 목록에만 있고 열리지 않는 행이 생기지 않도록 출처를 하나로 뒀다. (예전에는 예시 명령어에서
 * 만들어 쓰느라 목록에 있는 대화와 실제로 열리는 대화가 서로 달랐다.)
 * `id`는 `/chat/:id`로 이동할 때 쓴다.
 */
export type HistoryEntry = { id: string; text: string; isCommand: boolean; timeLabel: string }

export const HISTORY_ENTRIES: HistoryEntry[] = THREADS.map((thread) => ({
  id: thread.id,
  text: thread.title,
  isCommand: thread.isCommand,
  timeLabel: thread.timeLabel,
}))

/** 사이드바 "최근" — 지금은 대화가 다섯 개뿐이라 히스토리와 같은 목록이다. */
export const RECENT_ENTRIES: HistoryEntry[] = HISTORY_ENTRIES
