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

export interface TaskDetail {
  taskId: string
  status: TaskStatus
  taskType: string | null
  result: SystemStatusResult | FileSearchResult | null
  errorCode: string | null
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
