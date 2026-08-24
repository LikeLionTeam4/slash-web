// 등록된 PC 목록 — frontend-api-contract.md "지정 PC 관리 화면(W1-03)" 구현.
// 기기 이름 변경은 계약만 확정된 상태라(슬래시-api #22) 여기 없다.
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
  // 해제(DELETE) 요청의 If-Match에 그대로 넣는다 — 다른 탭에서 먼저 바뀐 기기를 낡은 화면이
  // 덮어쓰지 않도록 서버가 요구하는 낙관적 잠금 값이다(slash-api DeviceResponse.version).
  version: number
}

interface DeviceListResponse {
  devices: Device[]
}

export function listDevices(options?: Pick<ApiRequestOptions, 'silent'>): Promise<DeviceListResponse> {
  return apiRequest<DeviceListResponse>('/api/v1/devices', options)
}

/** PC 등록 해제. 되돌릴 수 없다 — 붙어있는 연결도 서버가 그 자리에서 끊는다(slash-api #23). */
export function revokeDevice(deviceId: string, expectedVersion: number): Promise<void> {
  return apiRequest<void>(`/api/v1/devices/${deviceId}`, {
    method: 'DELETE',
    ifMatch: `"${expectedVersion}"`,
  })
}
