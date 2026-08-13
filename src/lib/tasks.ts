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

// slash-api 이슈 #25에서 합의된 형태 — searchFolderId는 사람이 읽을 표시 이름이 아직 없어서
// (같은 이슈에 후속으로 남김) 화면에 폴더 이름으로 보여주는 용도로는 못 쓴다. fileRef로 열기/삭제
// 같은 후속 액션을 가리킬 수 있게 설계돼 있지만 그런 액션 자체가 계약에 아직 없어 이번엔 목록
// 표시까지만 쓴다.
export interface FileSearchResultItem {
  fileRef: string
  name: string
  relativePath: string
  extension: string
  sizeBytes: number
  modifiedAt: string
}

export interface FileSearchResult {
  searchFolderId: string
  query: string
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
