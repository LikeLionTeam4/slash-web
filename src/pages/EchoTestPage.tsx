import { useState } from 'react'

// slash-web-test 전용 페이지 — 프론트→백엔드(mock-api)→로컬 에이전트 종단 통신을
// 눈으로 확인하기 위한 것. RequireAuth 밖에 있어 로그인 없이 바로 접근한다.
// 실제 서비스 라우트가 아니므로 main/dev로 올리지 않는다.

interface DeviceSummary {
  deviceId: string
  name: string
  status: string
}

interface TaskEvent {
  eventId: string
  fromStatus: string | null
  toStatus: string | null
  message: string | null
  occurredAt: string
}

interface TaskDetail {
  taskId: string
  taskType: string | null
  processingRoute: string | null
  status: string
  result: Record<string, unknown> | null
  errorCode: string | null
}

async function unwrap<T>(res: Response): Promise<T> {
  const body = (await res.json()) as { data?: T; error?: { code: string; message: string } }
  if (!res.ok || !body.data) {
    throw new Error(body.error ? `${body.error.code}: ${body.error.message}` : `HTTP ${res.status}`)
  }
  return body.data
}

export function EchoTestPage() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:4000')
  // agent-app이 자동 페어링 시 로그인하는 시험 계정과 반드시 같아야 같은 기기가 보인다
  // (agent-app/src/main.cjs obtainPairingCode 참고).
  const [email, setEmail] = useState('agent-app-tester@example.com')
  const [message, setMessage] = useState('hello slash')
  const [log, setLog] = useState<string[]>([])
  const [device, setDevice] = useState<DeviceSummary | null>(null)
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [busy, setBusy] = useState(false)

  function appendLog(line: string) {
    setLog((prev) => [...prev, line])
  }

  async function handleSend() {
    setBusy(true)
    setLog([])
    setDevice(null)
    setTask(null)
    setEvents([])

    try {
      appendLog(`시험 로그인: ${email}`)
      const loginRes = await fetch(`${baseUrl}/test/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName: 'web-test' }),
      })
      const login = (await loginRes.json()) as { token: string }
      const token = login.token
      appendLog('로그인 완료')

      appendLog('READY 상태 기기 조회 중…')
      const devicesRes = await fetch(`${baseUrl}/api/v1/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const devices = await unwrap<DeviceSummary[]>(devicesRes)
      const readyDevice = devices.find((d) => d.status === 'READY')
      if (!readyDevice) {
        appendLog(`기기 ${devices.length}개 중 READY 상태가 없습니다. 로컬 에이전트가 켜져 있는지 확인하세요.`)
        setBusy(false)
        return
      }
      setDevice(readyDevice)
      appendLog(`기기 찾음: ${readyDevice.name} (${readyDevice.deviceId})`)

      appendLog(`명령 전송: "/command ${message}"`)
      const createRes = await fetch(`${baseUrl}/api/v1/requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          text: `/command ${message}`,
          selectedDeviceId: readyDevice.deviceId,
        }),
      })
      const created = await unwrap<{ taskId: string }>(createRes)
      appendLog(`taskId 발급: ${created.taskId}`)

      // 로컬 에이전트가 처리할 때까지 최대 5초 폴링한다.
      let finalTask: TaskDetail | null = null
      for (let i = 0; i < 25; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        const taskRes = await fetch(`${baseUrl}/api/v1/tasks/${created.taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const polled = await unwrap<TaskDetail>(taskRes)
        if (polled.status === 'SUCCEEDED' || polled.status === 'FAILED') {
          finalTask = polled
          break
        }
      }
      if (!finalTask) {
        appendLog('5초 안에 결과를 받지 못했습니다.')
        setBusy(false)
        return
      }
      setTask(finalTask)
      appendLog(`최종 상태: ${finalTask.status}`)

      const eventsRes = await fetch(`${baseUrl}/api/v1/tasks/${created.taskId}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const eventList = await unwrap<TaskEvent[]>(eventsRes)
      setEvents(eventList)
    } catch (err) {
      appendLog(`오류: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-xl font-bold">에코 종단 테스트 (slash-web-test 전용)</h1>
      <p className="text-sm text-muted">
        프론트 → mock-api(slash-api-test) → 로컬 에이전트(slash-agent-test) 순으로 메시지가
        오가는지 확인합니다. 실제 서비스 화면이 아닙니다.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        mock-api 주소
        <input
          className="rounded border px-3 py-2"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        시험 로그인 이메일 (agent-app 자동 페어링 계정과 같아야 기기가 보인다)
        <input
          className="rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        보낼 메시지
        <input
          className="rounded border px-3 py-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <button
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        disabled={busy}
        onClick={handleSend}
      >
        {busy ? '전송 중…' : '보내기'}
      </button>

      <div className="rounded border p-3 text-sm">
        <div className="font-semibold">진행 로그</div>
        <ul className="mt-1 list-disc pl-5">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      {device && (
        <div className="rounded border p-3 text-sm">
          <div className="font-semibold">연결된 기기</div>
          <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(device, null, 2)}</pre>
        </div>
      )}

      {task && (
        <div className="rounded border p-3 text-sm">
          <div className="font-semibold">Task 결과</div>
          <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(task, null, 2)}</pre>
        </div>
      )}

      {events.length > 0 && (
        <div className="rounded border p-3 text-sm">
          <div className="font-semibold">이벤트 타임라인</div>
          <ol className="mt-1 list-decimal pl-5">
            {events.map((e) => (
              <li key={e.eventId}>{e.message}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
