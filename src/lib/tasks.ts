// 작업 접수/조회 — frontend-api-contract.md "입력창 화면(W1-04)" 구현.
// selectedDeviceId는 일부러 옵셔널로만 받는다 — "PC 고르는 화면이 아직 없으면 생략해도 되고,
// 서버가 연결된 PC 중에서 알아서 고른다"가 계약이라, PC 선택 UI가 없는 지금은 아예 안 보낸다.
import { apiRequest, newIdempotencyKey } from './apiClient'

export type TaskStatus =
  | 'ANALYZING'
  | 'NEEDS_CLARIFICATION'
  | 'WAITING_FOR_DEVICE'
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'EXPIRED'

/** 진행 중(폴링 계속)인 상태 — SUCCEEDED/FAILED/EXPIRED만 최종 상태다. */
export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'EXPIRED'
}

export interface TaskCreateResponse {
  taskId: string
  status: TaskStatus
  statusUrl: string
}

export interface SystemStatusResult {
  cpuPercent: number
  memoryPercent: number
  memoryTotalMb: number
  memoryUsedMb: number
  diskPercent: number
  diskTotalMb: number
  diskUsedMb: number
  collectedAt: string
}

// slash-api 이슈 #25에서 실측된 형태 — Agent(slash-python-agent/file_index.py)가 이 네 필드만
// 보내고, 서버는 결과를 가공하지 않고 그대로 전달한다. fileRef·extension·searchFolderId·query는
// 계약에 없다(searchFolderId·query는 result가 아니라 task.parameters에 있다) — 열기/삭제 같은
// 후속 액션은 이슈 #25 2번 항목으로 아직 별도 설계 중.
export interface FileSearchResultItem {
  name: string
  relativePath: string
  sizeBytes: number
  modifiedAt: string
}

export interface FileSearchResult {
  items: FileSearchResultItem[]
  returnedCount: number
  truncated: boolean
}

// slash-infra 이슈 #42 검증 중 실측된 형태(slash-api PR #43 `WEATHER_LOOKUP`).
export interface WeatherLookupResult {
  location: string
  region: string
  country: string
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  precipitation: number
  description: string
  observedAt: string
}

// slash-infra 이슈 #42 검증 중 실측된 형태(slash-api PR #42 `TEXT_SUMMARY`, slash-llm 연동).
export interface TextSummaryResult {
  summary: string
  model: string
}

export interface TaskDetail {
  taskId: string
  status: TaskStatus
  taskType: string | null
  result: SystemStatusResult | FileSearchResult | WeatherLookupResult | TextSummaryResult | null
  errorCode: string | null
  // NEEDS_CLARIFICATION일 때만 채워진다 — slash-api TaskDetailResponse의 question/correlationId
  // 그대로다. correlationId는 지금은 화면에서 쓰지 않지만(백엔드가 이어가는 대화가 아니라 새
  // text로 새 요청을 받는 구조라 답변도 새 요청이다), 응답 계약을 그대로 담아둔다.
  question?: string | null
  correlationId?: string | null
}

export function createTaskRequest(text: string, selectedDeviceId?: string): Promise<TaskCreateResponse> {
  return apiRequest<TaskCreateResponse>('/api/v1/requests', {
    method: 'POST',
    body: selectedDeviceId ? { text, selectedDeviceId } : { text },
    idempotencyKey: newIdempotencyKey(),
  })
}

export function getTask(taskId: string): Promise<TaskDetail> {
  return apiRequest<TaskDetail>(`/api/v1/tasks/${taskId}`)
}

// 이력 화면·대시보드·사이드바 "최근" — frontend-api-contract.md "이력 화면 (P0-B)" 구현.
// result·parameters는 목록에 없다(한 건에 64KB까지 허용돼 스무 줄이면 1MB를 넘길 수 있어서) —
// 한 건 펼칠 때는 getTask로 따로 받는다.
export interface TaskHistoryItem {
  taskId: string
  status: TaskStatus
  /** 분석 전이거나 분석에 실패했으면 없다. */
  taskType?: string
  processingRoute?: string
  /** PC를 거치지 않는 작업(/weather·/summary)은 없다. */
  deviceId?: string
  requestSummary: string
  errorCode?: string
  createdAt: string
  /** 끝난 작업만 있다. */
  completedAt?: string
}

export interface TaskHistoryFilter {
  taskType?: string
  status?: TaskStatus
  deviceId?: string
  /** 1~100, 기본 20. */
  limit?: number
  /** 이전 응답의 nextCursor를 그대로 넣는다 — 뜻을 알 수 없는 값이라 내용을 들여다볼 필요는 없다. */
  cursor?: string
}

export interface TaskHistoryPage {
  items: TaskHistoryItem[]
  /** 없으면 마지막 쪽 — 항목 수가 limit과 같은지로 판단하면 안 된다. */
  nextCursor?: string
}

export function getTaskHistory(filter: TaskHistoryFilter = {}): Promise<TaskHistoryPage> {
  const params = new URLSearchParams()
  if (filter.taskType) params.set('taskType', filter.taskType)
  if (filter.status) params.set('status', filter.status)
  if (filter.deviceId) params.set('deviceId', filter.deviceId)
  if (filter.limit) params.set('limit', String(filter.limit))
  if (filter.cursor) params.set('cursor', filter.cursor)

  const query = params.toString()
  return apiRequest<TaskHistoryPage>(`/api/v1/tasks${query ? `?${query}` : ''}`)
}

/** 히스토리·최근·대시보드가 공유하는 행 모양. `text`가 `/`로 시작하면 슬래시 명령이다 —
 *  requestSummary는 사용자가 입력한 원문 그대로라, 명령으로 물었으면 원문도 `/`로 시작한다. */
export type HistoryEntry = { id: string; text: string; isCommand: boolean; timeLabel: string }

export function toHistoryEntry(item: TaskHistoryItem): HistoryEntry {
  return {
    id: item.taskId,
    text: item.requestSummary,
    isCommand: item.requestSummary.startsWith('/'),
    timeLabel: formatRelativeTime(item.createdAt),
  }
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays === 1) return '어제'
  if (diffDays === 2) return '그저께'
  if (diffDays < 7) return `${diffDays}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}
