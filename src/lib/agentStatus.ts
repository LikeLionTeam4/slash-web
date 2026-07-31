// 로컬 에이전트(slash-agent)가 이 PC에서 응답하는지 확인한다. slash-agent 레포는 아직 README만
// 있는 빈 상태라 포트/엔드포인트가 정식으로 정해지지 않았다 — 아래 값은 확정 전 임시값이니,
// 실제 스펙이 나오면 반드시 맞춰 바꿔야 한다.
const AGENT_HEALTH_URL = 'http://127.0.0.1:47285/health'
const TIMEOUT_MS = 1500

export async function checkAgentStatus(): Promise<boolean> {
  try {
    const res = await fetch(AGENT_HEALTH_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    return res.ok
  } catch {
    return false
  }
}
