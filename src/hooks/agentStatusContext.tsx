import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { checkAgentStatus } from '../lib/agentStatus'

export type AgentStatus = 'online' | 'offline'

const POLL_INTERVAL_MS = 5000

const AgentStatusContext = createContext<AgentStatus | null>(null)

/**
 * 로컬 에이전트가 떠 있는지를 앱 전체가 하나의 값으로 공유한다 — 사이드바 아이콘과 검색창 경고,
 * 설정의 PC 관리가 서로 다른 순간에 서로 다른 상태를 보여주면 안 되므로 폴링도 한 번만 돈다.
 * 이 PC의 상태만 알 수 있다 (다른 등록 PC는 이 브라우저에서 확인할 방법이 없다).
 */
export function AgentStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AgentStatus>('offline')

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      const online = await checkAgentStatus()
      if (!cancelled) setStatus(online ? 'online' : 'offline')
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return <AgentStatusContext.Provider value={status}>{children}</AgentStatusContext.Provider>
}

export function useAgentStatus(): AgentStatus {
  const value = useContext(AgentStatusContext)
  if (value === null) throw new Error('useAgentStatus는 AgentStatusProvider 안에서만 쓸 수 있어요.')
  return value
}
