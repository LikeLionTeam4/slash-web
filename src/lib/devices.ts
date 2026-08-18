// 등록된 PC 목록 — frontend-api-contract.md "지정 PC 관리 화면(W1-03)" 구현.
// 기기 이름 변경·연결 해제는 계약만 확정된 상태라(슬래시-api #22) 여기 없다.
import { apiRequest, type ApiRequestOptions } from './apiClient'

export type DeviceStatus = 'READY' | 'ONLINE' | 'BUSY' | 'OFFLINE'

export interface Device {
  deviceId: string
  name: string
  status: DeviceStatus
  os: 'WINDOWS' | 'MACOS'
  // Agent가 보고한 원문 그대로 — 한 번도 연결된 적 없으면 없다.
  osVersion?: string
  agentVersion?: string
  lastSeenAt?: string
  registeredAt: string
}

interface DeviceListResponse {
  devices: Device[]
}

export function listDevices(options?: Pick<ApiRequestOptions, 'silent'>): Promise<DeviceListResponse> {
  return apiRequest<DeviceListResponse>('/api/v1/devices', options)
}
