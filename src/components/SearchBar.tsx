import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Mic, AudioLines, Paperclip, Camera, Plus, ArrowUp, X, FileText, ChevronDown, Trash2, Loader2 } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { MicSettingsPopover } from './MicSettingsPopover'
import {
  ModelPickerPanel,
  ServiceIcon,
  SERVICES,
  MODELS_BY_SERVICE,
  type ModelView,
  type SelectedModel,
} from './ModelPickerPanel'
import { parseCommandChain, mockPlaceholderMessage } from '../lib/mockCommands'
import { buildDeepLink, deepLinkHint } from '../lib/deepLinks'
import { getSuggestions, findCommand, type CommandNode } from '../lib/commandTree'
import { useFileSearch } from '../hooks/fileSearchContext'
import { useAgentStatus } from '../hooks/agentStatusContext'
import { ApiError } from '../lib/apiClient'
import { createTaskRequest, getTask, isTerminalTaskStatus, type SystemStatusResult, type TaskStatus } from '../lib/tasks'

function AddMenuItem({
  icon: Icon,
  label,
  trailing,
  onClick,
}: {
  icon: typeof Plus
  label: string
  trailing?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-foreground/8"
    >
      <Icon size={16} className="shrink-0 text-muted" />
      <span className="flex-1">{label}</span>
      {trailing}
    </button>
  )
}

type Attachment = {
  id: string
  name: string
  /** Preview image URL — present for images/screenshots, absent for other file types. */
  url?: string
}

/** 명령어가 이미 받은 값 하나를 나타내는 검색바 안쪽 칩. */
function OperandChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent-blue/12 py-1 pl-2.5 pr-1.5 text-xs font-medium text-accent-blue">
      {label}
      <button
        type="button"
        aria-label={`${label} 지우기`}
        onClick={onClear}
        className="flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-accent-blue/20"
      >
        <X size={11} />
      </button>
    </span>
  )
}

/** 파일 검색 결과를 접어둘 때 보여줄 개수. */
const COLLAPSED_FILE_RESULTS = 10

/** 목적격 조사 — 받침이 있으면 '을', 없으면 '를'. ('검색어를 입력' / '파일 이름을 입력') */
function withObjectParticle(noun: string): string {
  const code = noun.charCodeAt(noun.length - 1)
  const hasFinalConsonant = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  return `${noun}${hasFinalConsonant ? '을' : '를'}`
}

/** 진행 중 상태별 안내 문구 — frontend-api-contract.md §W1-04 "상태값" 표. */
const TASK_STATUS_LABELS: Partial<Record<TaskStatus, string>> = {
  ANALYZING: '무슨 요청인지 분석하는 중이에요',
  QUEUED: 'PC로 보냈어요, 수락을 기다리는 중이에요',
  RUNNING: '실행 중이에요',
  WAITING_FOR_DEVICE: 'PC가 꺼져 있어요 — 켜지면 자동으로 실행돼요',
  NEEDS_CLARIFICATION: '추가 정보가 필요해요',
}

/** 실패한 작업의 errorCode별 안내 — 계약서 §4 표 중 /status가 실제로 낼 수 있는 것들. */
const TASK_ERROR_MESSAGES: Partial<Record<string, string>> = {
  DEVICE_NOT_READY: 'PC 연결 상태를 확인해주세요.',
  DEVICE_BUSY: '다른 작업을 실행 중이에요. 잠시 후 다시 시도해주세요.',
  TASK_TYPE_NOT_SUPPORTED: '이 PC가 지원하지 않는 기능이에요.',
  TASK_EXPIRED: '실행 기한이 지났어요.',
  UNRECOGNIZED_COMMAND: '요청을 알아듣지 못했어요.',
  AGENT_REJECTED: 'PC가 이 요청을 받지 않았어요.',
  AGENT_TASK_FAILED: 'PC에서 실행이 끝나지 못했어요.',
  NLU_UNAVAILABLE: '잠시 후 다시 시도해주세요.',
  UPSTREAM_UNAVAILABLE: '외부 서비스에 문제가 있어요.',
}

function taskErrorMessage(code: string | null): string {
  return (code && TASK_ERROR_MESSAGES[code]) || '요청이 실패했어요.'
}

type StatusTaskState =
  | { phase: 'idle' }
  | { phase: 'running'; status: TaskStatus }
  | { phase: 'done'; result: SystemStatusResult }
  | { phase: 'failed'; message: string }

const STATUS_POLL_INTERVAL_MS = 2000

export function SearchBar({ presetQuery }: { presetQuery?: { path: string[]; operands: string[] } }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [micSettingsOpen, setMicSettingsOpen] = useState(false)
  const [selectedMicId, setSelectedMicId] = useState<string | null>(null)
  const [holdToRecord, setHoldToRecord] = useState(true)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [fileHighlight, setFileHighlight] = useState(0)
  const [fileListExpanded, setFileListExpanded] = useState(false)
  const [modelView, setModelView] = useState<ModelView>('services')
  const [modelHighlight, setModelHighlight] = useState(0)
  const [selectedModel, setSelectedModel] = useState<SelectedModel>({ service: 'claude', modelId: 'sonnet-5' })
  const [modelSearchPickerOpen, setModelSearchPickerOpen] = useState(false)
  // 값을 받는 명령(`/네이버`, `/구글`, `/파일`, `/네이버/길찾기` …)은 명령어 텍스트를 입력창에
  // 남겨두지 않고 칩으로 뺀다. path = 명령어 경로, operands = 이미 확정된 값(칩).
  // 지금 입력 중인 값은 `value`에 있다 — 명령어와 검색어는 한 문자열로 합치지 않고 끝까지 따로
  // 들고 있다가 백엔드에도 따로 보낸다.
  const [commandMode, setCommandMode] = useState<{ path: string[]; operands: string[] } | null>(null)
  const [statusTask, setStatusTask] = useState<StatusTaskState>({ phase: 'idle' })
  const statusPollTimeoutRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileListRef = useRef<HTMLDivElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const fileSearch = useFileSearch()
  const agentStatus = useAgentStatus()
  const navigate = useNavigate()
  const location = useLocation()
  // IME composition tracking (한글/일본어/중국어 등) — Enter that confirms a composing syllable
  // must NOT also trigger our own Enter handling, or the last character doubles.
  const isComposingRef = useRef(false)
  const compositionEndedAtRef = useRef(0)
  // 조합 확정에 먹힌 Enter가 있었는지 — 같은 키의 keyup에서 실제 동작을 실행하기 위한 표시.
  const pendingEnterRef = useRef(false)

  const trimmed = value.trim()
  const hasText = trimmed.length > 0
  // 명령어 모드에서는 입력창에 명령어 텍스트가 남아 있지 않고(칩으로 빠져 있음) 값만 들어있다 —
  // 그래도 명령 모드이므로 `/` 배지는 파랗게, 자유입력 힌트는 뜨지 않게 해야 한다.
  const isCommand = value.startsWith('/') || commandMode !== null
  const isFreeText = hasText && !isCommand
  const hasAttachments = attachments.length > 0
  const active = focused || hasText || commandMode !== null
  const shape = hasAttachments ? 'rounded-[28px]' : 'rounded-full'

  // 명령어가 받는 값들의 이름 — 하나면 한 번에 받고, 둘 이상이면 Enter마다 한 값씩 확정한다.
  const operandNames = (commandMode ? findCommand(commandMode.path)?.operands : null) ?? []
  const stepped = operandNames.length > 1
  const nextOperandName: string | undefined = operandNames[commandMode?.operands.length ?? 0]
  const operandsFilled = commandMode !== null && operandNames.length > 0 && nextOperandName === undefined

  // 명령어 모드에서는 텍스트를 파싱하지 않는다 — 경로와 값이 이미 나뉘어 있으니 그대로 조립만 한다.
  // (모드에 들어가지 않는 미등록 명령은 예전처럼 한 줄 텍스트에서 파싱한다.)
  const commandChain =
    commandMode !== null
      ? hasText
        ? { namespace: commandMode.path[0], action: commandMode.path[1] ?? '', query: trimmed }
        : null
      : isCommand
        ? parseCommandChain(value)
        : null
  const suggestions = commandMode === null && isCommand ? getSuggestions(value) : null
  const isFileSearchCommand = commandChain?.namespace === '파일' && !commandChain.action
  const isModelSearchCommand = commandChain?.namespace === '모델' && commandChain.action === '검색'
  const placeholderMsg = commandChain ? mockPlaceholderMessage(commandChain) : null
  const deepLink = commandChain ? buildDeepLink(commandChain) : null
  const deepLinkHintText = commandChain ? deepLinkHint(commandChain) : null
  // 값을 여러 개 받는 명령은 입력 중에도 "지금 무슨 값을 받는 중인지"를 계속 보여준다.
  // 하나만 받는 명령은 값을 치기 시작하면 딥링크·준비중 안내에 자리를 넘긴다.
  const commandModeHint =
    commandMode === null
      ? null
      : operandsFilled
        ? `${commandMode.operands.join(' → ')} · 아직 준비 중이에요.`
        : stepped || !hasText
          ? `${withObjectParticle(nextOperandName!)} 입력하고 Enter를 눌러주세요.`
          : null
  const fileResults = isFileSearchCommand ? fileSearch.search(commandChain!.query) : []
  const hasSearchFolders = fileSearch.folders.length > 0 || fileSearch.readOnlyFolders.length > 0
  // 결과가 많을 수 있으므로 처음에는 위에서 10개만 — 패널이 화면을 다 덮으면 검색어를 고쳐 칠 수가
  // 없다. 나머지는 '더 보기'로 펼치고, 펼친 목록은 그 안에서 스크롤된다.
  const visibleFileResults = fileListExpanded ? fileResults : fileResults.slice(0, COLLAPSED_FILE_RESULTS)
  const hiddenFileCount = fileResults.length - visibleFileResults.length
  const currentServiceLabel = SERVICES.find((s) => s.id === selectedModel.service)?.label ?? ''
  const currentModelLabel =
    MODELS_BY_SERVICE[selectedModel.service].find((m) => m.id === selectedModel.modelId)?.label ?? ''
  // 모델 이름이 이미 서비스 이름으로 시작하면 "Gemini · Gemini 3 Flash"처럼 겹쳐 읽힌다.
  const modelDestination = currentModelLabel.startsWith(currentServiceLabel)
    ? currentModelLabel
    : `${currentServiceLabel} · ${currentModelLabel}`

  const showModelPicker = commandMode === null && trimmed === '/모델'
  const showTrash = commandMode === null && trimmed === '/파일/휴지통'
  const showStatusCommand = commandMode === null && trimmed === '/상태'
  const showSuggestions = !!suggestions && !showModelPicker && !showTrash && !showStatusCommand
  // 폴더가 하나도 없으면 파일 이름을 다 친 뒤가 아니라 `/파일`에 들어서는 순간 알려준다 —
  // 검색어를 다 입력하고 나서야 "검색할 데가 없다"고 하는 건 너무 늦다.
  const needsFolderSetup =
    fileSearch.supported && !hasSearchFolders && commandMode?.path.length === 1 && commandMode.path[0] === '파일'
  const showFileSearch =
    !showSuggestions && !showModelPicker && !showTrash && (isFileSearchCommand || needsFolderSetup)
  const showModelSearch =
    !showSuggestions && !showModelPicker && !showTrash && !showFileSearch && isModelSearchCommand
  // 폴더 안내 패널이 떠 있으면 "파일 이름을 입력하고 Enter" 줄은 겹쳐서 시끄럽기만 하다.
  const showCommandModeHint = !!commandModeHint && !showFileSearch
  const showPlaceholderMsg =
    !showSuggestions &&
    !showModelPicker &&
    !showTrash &&
    !showFileSearch &&
    !showModelSearch &&
    !showCommandModeHint &&
    !!placeholderMsg
  const showDeepLinkHint =
    !showSuggestions &&
    !showModelPicker &&
    !showTrash &&
    !showFileSearch &&
    !showModelSearch &&
    !showCommandModeHint &&
    !!deepLinkHintText
  const showCommandHint =
    !showSuggestions &&
    !showModelPicker &&
    !showTrash &&
    !showStatusCommand &&
    !showFileSearch &&
    !showModelSearch &&
    !showPlaceholderMsg &&
    !showDeepLinkHint &&
    !showCommandModeHint &&
    isCommand
  const modelPickerActive = showModelPicker || (showModelSearch && modelSearchPickerOpen)

  useEffect(() => {
    setHighlightIndex(0)
    setFileHighlight(0)
    setFileListExpanded(false)
  }, [value])

  // 펼친 목록은 스크롤되므로, 키보드로 고른 줄이 화면 밖에 있으면 따라 들어와야 한다.
  useEffect(() => {
    fileListRef.current?.querySelector(`[data-file-index="${fileHighlight}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [fileHighlight])

  // Suggestion chips on the home screen set a query in from the outside — the caller passes a new
  // object each time (even for the same value), so this fires even on repeat clicks of one chip.
  // 칩도 명령어와 값을 따로 넘기므로 문자열을 만들었다가 다시 쪼갤 일이 없다. 마지막 값만 입력창에
  // 남겨 바로 Enter를 칠 수 있게 하고, 앞의 값들은 확정된 칩으로 들어간다.
  useEffect(() => {
    if (!presetQuery) return
    setCommandMode({ path: presetQuery.path, operands: presetQuery.operands.slice(0, -1) })
    setValue(presetQuery.operands[presetQuery.operands.length - 1] ?? '')
    textInputRef.current?.focus()
  }, [presetQuery])

  // Reset the model picker's drill-down state whenever it closes, so reopening starts fresh.
  useEffect(() => {
    if (!modelPickerActive) {
      setModelView('services')
      setModelHighlight(0)
    }
  }, [modelPickerActive])

  // /status를 벗어나면(입력을 지우거나 다른 명령으로 바꾸면) 진행 중이던 폴링도 함께 멈춘다 —
  // 안 그러면 화면에 없는 패널을 위해 계속 GET /api/v1/tasks/{taskId}를 부르게 된다.
  useEffect(() => {
    if (showStatusCommand) return
    if (statusPollTimeoutRef.current !== null) {
      clearTimeout(statusPollTimeoutRef.current)
      statusPollTimeoutRef.current = null
    }
    setStatusTask({ phase: 'idle' })
  }, [showStatusCommand])

  // 언마운트 시에도 폴링 타이머를 남기지 않는다.
  useEffect(() => {
    return () => {
      if (statusPollTimeoutRef.current !== null) clearTimeout(statusPollTimeoutRef.current)
    }
  }, [])

  // /모델/검색 stops being the active command (query cleared, chain changed, etc.) — collapse
  // the inline "모델 변경" picker so it doesn't linger open under a different panel next time.
  useEffect(() => {
    if (!showModelSearch) setModelSearchPickerOpen(false)
  }, [showModelSearch])

  function selectSuggestion(pathIds: string[], option: CommandNode) {
    const fullPath = [...pathIds, option.id]
    if (option.operands) {
      // 값을 받는 명령 — 명령어 텍스트는 칩으로 빠지고 입력창은 값만 받는다.
      setCommandMode({ path: fullPath, operands: [] })
      setValue('')
    } else if (option.id === '모델') {
      setValue(`/${fullPath.join('/')}`)
    } else {
      setValue(`/${fullPath.join('/')} `)
    }
  }

  /**
   * `/네이버 ` 처럼 등록된 명령 뒤에 공백을 치면 명령어를 칩으로 빼고 입력창에는 나머지만 남긴다.
   * 붙여넣기(`/네이버/지도 강남역 맛집`)도 같은 경로로 들어온다. 해당 없으면 null.
   */
  function splitCommandFromText(text: string): { path: string[]; rest: string } | null {
    const match = text.match(/^\/([^\s]+)\s(.*)$/)
    if (!match) return null
    const path = match[1].split('/')
    return findCommand(path)?.operands ? { path, rest: match[2] } : null
  }

  function handleValueChange(next: string) {
    const split = commandMode === null ? splitCommandFromText(next) : null
    if (split) {
      setCommandMode({ path: split.path, operands: [] })
      setValue(split.rest)
      return
    }
    setValue(next)
  }

  /**
   * 모델 확정 — 서비스 목록이 아니라 모델 목록에서 고른 순간에만 부른다.
   * 모델 목록은 트리의 끝이라 여기서 Enter는 "더 들어가기"가 아니라 "고르기 끝"이어야 한다.
   * 단독 `/모델` 피커는 입력창을 비워 스스로 닫고 바로 질문을 칠 수 있는 상태로 돌려준다.
   * (`/모델/검색`의 인라인 피커는 이미 친 질문을 지우면 안 되므로 피커만 접는다.)
   */
  function selectModel(modelId: string) {
    setSelectedModel({ service: modelView as Exclude<ModelView, 'services'>, modelId })
    setModelSearchPickerOpen(false)
    if (showModelPicker) setValue('')
  }

  /** 검색할 폴더는 설정에서 정한다 — 설정 모달은 URL 해시로 열린다(AppShell). */
  function openFolderSettings() {
    navigate({ pathname: location.pathname, hash: '#settings/general' })
  }

  // 딥링크 명령(/네이버/지도, /네이버/길찾기)은 결과가 앱 밖 새 탭에서 열린다 — 이슈 #6의 방식 1.
  // window.open은 클릭/Enter 같은 사용자 제스처 안에서 호출해야 팝업 차단을 피할 수 있다.
  function openDeepLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /** POST /api/v1/requests → GET /api/v1/tasks/{taskId} 2초 폴링 — WSS는 아직 안 붙였다(§7,
   *  "WSS 안 붙어도 폴링만으로 화면은 정상 동작"이 계약이라 당장은 이걸로 충분하다). */
  function pollStatusTask(taskId: string) {
    getTask(taskId)
      .then((task) => {
        if (task.status === 'SUCCEEDED') {
          setStatusTask({ phase: 'done', result: task.result! })
          return
        }
        if (task.status === 'FAILED' || task.status === 'EXPIRED') {
          setStatusTask({ phase: 'failed', message: taskErrorMessage(task.errorCode) })
          return
        }
        setStatusTask({ phase: 'running', status: task.status })
        statusPollTimeoutRef.current = window.setTimeout(() => pollStatusTask(taskId), STATUS_POLL_INTERVAL_MS)
      })
      .catch(() => {
        // 폴링 중 일시적 오류는 다음 주기에 다시 시도한다 — Task 자체는 서버에 이미 접수돼 있다.
        statusPollTimeoutRef.current = window.setTimeout(() => pollStatusTask(taskId), STATUS_POLL_INTERVAL_MS)
      })
  }

  async function runStatusCommand() {
    if (statusTask.phase === 'running') return
    setStatusTask({ phase: 'running', status: 'ANALYZING' })
    try {
      const created = await createTaskRequest('/상태')
      if (isTerminalTaskStatus(created.status)) {
        pollStatusTask(created.taskId) // 드물지만 접수 시점에 이미 끝난 경우 — 같은 경로로 한 번 더 조회해 result를 받는다.
      } else {
        statusPollTimeoutRef.current = window.setTimeout(() => pollStatusTask(created.taskId), STATUS_POLL_INTERVAL_MS)
        setStatusTask({ phase: 'running', status: created.status })
      }
    } catch (err) {
      setStatusTask({
        phase: 'failed',
        message: err instanceof ApiError ? err.message : '요청을 보내지 못했어요. 잠시 후 다시 시도해주세요.',
      })
    }
  }

  function submitCommand() {
    if (commandMode && stepped) {
      // 값을 여러 개 받는 명령은 Enter마다 한 값씩 칩으로 확정한다. 마지막 값까지 모이면
      // 명령어(`/네이버/길찾기`)와 값 배열이 그대로 백엔드에 보낼 수 있는 형태로 남는다.
      // TODO(#6): { command, operands } 를 백엔드 길찾기 엔드포인트로 보내고 결과 패널에 렌더한다.
      // 딥링크로 넘기지 않기로 한 이유 — 이름만으로는 네이버가 경로를 계산해주지 않고(좌표 필요,
      // DESIGN.md §9), 결과가 앱 밖으로 나가면 스레드/히스토리에 남지 않는다.
      if (!hasText || operandsFilled) return
      setCommandMode({ ...commandMode, operands: [...commandMode.operands, trimmed] })
      setValue('')
      return
    }
    if (!deepLink) return
    openDeepLink(deepLink)
  }

  /** Enter가 하는 일을 한 곳에 모아둔다 — keydown과 (조합 확정 시) keyup 양쪽에서 부른다. */
  function runEnterAction() {
    if (modelPickerActive) {
      if (modelView === 'services') {
        setModelView(SERVICES[modelHighlight].id)
        setModelHighlight(0)
      } else {
        selectModel(MODELS_BY_SERVICE[modelView][modelHighlight].id)
      }
      return
    }
    // 파일 검색은 결과가 곧 결론이다 — Enter는 명령을 보내는 게 아니라 고른 파일을 연다.
    if (showFileSearch && fileResults.length > 0) {
      const file = fileResults[fileHighlight] ?? fileResults[0]
      fileSearch.openFile(file.folderName, file.path)
      return
    }
    if (showStatusCommand) {
      runStatusCommand()
      return
    }
    if (commandMode || deepLink) {
      submitCommand()
      return
    }
    if (suggestions) {
      selectSuggestion(suggestions.pathIds, suggestions.options[highlightIndex] ?? suggestions.options[0])
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // 미뤄둔 Enter는 그 키를 뗄 때까지만 유효하다. 조합을 확정하는 Enter의 keyup은 IME가 삼켜서
    // 아예 오지 않을 수 있는데, 그러면 깃발이 계속 남아 있다가 그다음 Enter의 keyup이 그걸 주워
    // 동작을 한 번 더 실행한다 — keydown에서 한 번, keyup에서 또 한 번. `/모델`에서 서비스로
    // 들어가자마자 그 서비스의 첫 모델이 선택되고 창이 닫히던 증상이 이것이었다.
    pendingEnterRef.current = false

    if (e.key === 'Enter') {
      // 한글/일본어/중국어는 마지막 음절이 조합 중인 채로 Enter를 맞는다. 그 Enter로 여기서 바로
      // 상태를 바꾸면 조합 중이던 글자가 중복 입력된다(예전 "검색" 버그). 그렇다고 그냥 버리면
      // 한글 입력은 항상 Enter를 두 번 눌러야 한다.
      // → 같은 키의 keyup으로 미룬다. 그때는 조합이 이미 확정됐고, keyup도 사용자 제스처라
      //   window.open이 팝업 차단에 걸리지도 않는다.
      // (일부 브라우저는 조합을 확정하는 바로 그 keydown에서도 isComposing:false를 보고하므로
      //  ref와 짧은 유예 시간까지 함께 본다.)
      const justFinishedComposing = Date.now() - compositionEndedAtRef.current < 50
      if (e.nativeEvent.isComposing || isComposingRef.current || justFinishedComposing) {
        pendingEnterRef.current = true
        return
      }
      e.preventDefault()
      runEnterAction()
      return
    }

    if (modelPickerActive) {
      const list = modelView === 'services' ? SERVICES : MODELS_BY_SERVICE[modelView]
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setModelHighlight((i) => (i + 1) % list.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setModelHighlight((i) => (i - 1 + list.length) % list.length)
      } else if (e.key === 'ArrowRight' && modelView === 'services') {
        // → drills into the highlighted service, same as Enter would at this level.
        e.preventDefault()
        setModelView(SERVICES[modelHighlight].id)
        setModelHighlight(0)
      } else if (e.key === 'ArrowLeft' && modelView !== 'services') {
        // ← backs out to the service list, same as Escape would at this level.
        e.preventDefault()
        setModelView('services')
        setModelHighlight(0)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (modelView !== 'services') {
          setModelView('services')
          setModelHighlight(0)
        } else if (modelSearchPickerOpen) {
          // Closing the inline "모델 변경" picker should keep the typed query — only clear
          // the input when Escape is pressed on the standalone /모델 picker.
          setModelSearchPickerOpen(false)
        } else {
          setValue('')
        }
      }
      return
    }

    // 파일 결과 위아래로 옮기기. 명령어 모드 안에서 도는 목록이라 아래 commandMode 처리보다 먼저 본다.
    if (showFileSearch && fileResults.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      const visible = visibleFileResults.length
      if (e.key === 'ArrowUp') {
        setFileHighlight((i) => (i - 1 + visible) % visible)
        return
      }
      // 접어둔 마지막 줄에서 한 번 더 내리면 나머지를 펼친다 — 키보드만으로도 11번째에 닿아야 한다.
      const next = fileHighlight + 1
      if (next >= visible && hiddenFileCount > 0) {
        setFileListExpanded(true)
        setFileHighlight(next)
      } else {
        setFileHighlight(next >= visible ? 0 : next)
      }
      return
    }

    if (commandMode) {
      if (e.key === 'Escape') {
        // 두 단계로 나눈다 — 긴 검색어를 지우려고 Backspace를 오래 누르고 있을 이유가 없어야 하고,
        // 그렇다고 오타 하나 고치려다 명령어까지 잃어버려서도 안 된다.
        e.preventDefault()
        if (value !== '') setValue('')
        else setCommandMode(null)
      } else if (e.key === 'Backspace' && value === '') {
        // 빈 입력창에서 Backspace = 한 단계씩 되돌린다 (CLI 지우기 감각).
        // 확정한 값 → … → 명령어 텍스트(`/네이버/길찾기`). 값이 없을 때 한 번 더 지우면 명령어 모드를
        // 빠져나가 텍스트로 복원하므로, 되돌리다 막다른 곳에 갇히지 않는다.
        e.preventDefault()
        if (commandMode.operands.length > 0) {
          setCommandMode({ ...commandMode, operands: commandMode.operands.slice(0, -1) })
        } else {
          setCommandMode(null)
          // 공백 없이 복원해야 한다 — 공백이 붙으면 곧바로 다시 명령어 모드로 들어간다.
          setValue(`/${commandMode.path.join('/')}`)
        }
      }
      return
    }

    if (!suggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => (i + 1) % suggestions.options.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (i - 1 + suggestions.options.length) % suggestions.options.length)
    } else if (e.key === 'Escape') {
      setValue('')
    }
  }

  /** 조합 확정에 먹힌 Enter를 여기서 이어받는다 — 조합이 끝난 값 기준으로 한 번만 실행된다. */
  function handleInputKeyUp(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' || !pendingEnterRef.current) return
    pendingEnterRef.current = false
    e.preventDefault()
    runEnterAction()
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target?.url) URL.revokeObjectURL(target.url)
      return prev.filter((a) => a.id !== id)
    })
  }

  function handleAddFiles() {
    setAddMenuOpen(false)
    fileInputRef.current?.click()
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files) return
    const next: Attachment[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setAttachments((prev) => [...prev, ...next])
  }

  function startRecording() {
    const SpeechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionCtor || recognitionRef.current) return

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'ko-KR'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join('')
      setValue(transcript)
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  function stopRecording() {
    recognitionRef.current?.stop()
  }

  async function handleCaptureScreenshot() {
    setAddMenuOpen(false)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      stream.getTracks().forEach((track) => track.stop())
      setAttachments((prev) => [
        ...prev,
        { id: `screenshot-${Date.now()}`, name: '스크린샷', url: canvas.toDataURL('image/png') },
      ])
    } catch {
      // user cancelled the picker or denied permission — no-op
    }
  }

  return (
    <div className="relative w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files)
          e.target.value = ''
        }}
      />
      {/* 1.5px padding + conditional gradient bg = a gradient ring on focus, a plain hairline ring otherwise.
          Shape grows from a full pill to a rounded rectangle when attachments are present, so previews
          live inside the same bordered container instead of floating above it. */}
      <div
        className={`w-full ${shape} p-[1.5px] transition-[background] duration-200 ${
          active ? 'brand-gradient' : 'bg-hairline'
        }`}
      >
        <div className={`flex w-full flex-col ${shape} bg-surface`}>
          {hasAttachments && (
            <div className="flex flex-wrap gap-2 px-4 pb-1 pt-3.5">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-hairline"
                >
                  {a.url ? (
                    <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface-raised p-1">
                      <FileText size={18} className="text-muted" />
                      <span className="w-full truncate text-center text-2xs text-muted">{a.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    title="제거"
                    aria-label={`${a.name} 제거`}
                    onClick={() => removeAttachment(a.id)}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex w-full items-center gap-3 px-4 py-3.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                isCommand ? 'bg-accent-blue text-white' : 'bg-foreground/8 text-foreground'
              }`}
            >
              /
            </span>
            {commandMode && (
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="rounded-full bg-accent-blue/12 px-2.5 py-1 text-xs font-medium text-accent-blue">
                  {commandMode.path.join('/')}
                </span>
                {commandMode.operands.map((operand, i) => (
                  <OperandChip
                    key={`${operandNames[i]}-${operand}`}
                    label={`${operandNames[i]} ${operand}`}
                    // 앞의 값을 지우면 그 뒤에 받은 값들도 함께 빠진다 — 순서가 곧 의미이므로
                    // 중간만 비어 있는 상태를 만들지 않는다.
                    onClear={() => {
                      setCommandMode({ ...commandMode, operands: commandMode.operands.slice(0, i) })
                      textInputRef.current?.focus()
                    }}
                  />
                ))}
              </div>
            )}
            <input
              ref={textInputRef}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onKeyUp={handleInputKeyUp}
              onCompositionStart={() => {
                isComposingRef.current = true
              }}
              onCompositionEnd={() => {
                isComposingRef.current = false
                compositionEndedAtRef.current = Date.now()
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                isRecording
                  ? '듣고 있어요...'
                  : commandMode
                    ? nextOperandName
                      ? `${nextOperandName} 입력`
                      : ''
                    : "무엇이든 물어보세요 · '/'로 명령어도 가능해요"
              }
              className="min-w-0 flex-1 bg-transparent text-control font-medium text-foreground placeholder:text-muted focus:outline-none"
            />
            <div className="group relative flex shrink-0 items-center">
              <Tooltip label="마이크 설정">
                <button
                  type="button"
                  aria-label="마이크 설정"
                  onClick={() => setMicSettingsOpen((o) => !o)}
                  className="flex h-6 w-4 items-center justify-center text-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                >
                  <ChevronDown size={14} />
                </button>
              </Tooltip>
              <Tooltip label={holdToRecord ? '길게 눌러 녹음' : '클릭해서 녹음'}>
                <button
                  type="button"
                  aria-label="음성 입력"
                  onMouseDown={holdToRecord ? startRecording : undefined}
                  onMouseUp={holdToRecord ? stopRecording : undefined}
                  onMouseLeave={holdToRecord ? () => isRecording && stopRecording() : undefined}
                  onTouchStart={holdToRecord ? startRecording : undefined}
                  onTouchEnd={holdToRecord ? stopRecording : undefined}
                  onClick={!holdToRecord ? () => (isRecording ? stopRecording() : startRecording()) : undefined}
                  className={`shrink-0 transition-colors ${
                    isRecording ? 'animate-pulse text-accent-blue' : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Mic size={18} />
                </button>
              </Tooltip>
              {micSettingsOpen && (
                <MicSettingsPopover
                  selectedDeviceId={selectedMicId}
                  onSelectDevice={setSelectedMicId}
                  holdToRecord={holdToRecord}
                  onHoldToRecordChange={setHoldToRecord}
                  onClose={() => setMicSettingsOpen(false)}
                />
              )}
            </div>
            {hasText ? (
              <Tooltip label="검색하기">
                <button
                  type="button"
                  aria-label="검색"
                  onClick={submitCommand}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:brightness-110 ${
                    isCommand ? 'bg-accent-blue text-white' : 'bg-foreground/12 text-foreground'
                  }`}
                >
                  <ArrowUp size={16} />
                </button>
              </Tooltip>
            ) : (
              <Tooltip label="음성 모드">
                <button
                  type="button"
                  aria-label="음성 모드"
                  onClick={() => alert('준비 중입니다.')}
                  className="shrink-0 text-muted transition-colors hover:text-foreground"
                >
                  <AudioLines size={18} />
                </button>
              </Tooltip>
            )}
            <div className="relative shrink-0">
              <Tooltip label="추가">
                <button
                  type="button"
                  aria-label="추가"
                  onClick={() => setAddMenuOpen((o) => !o)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                    addMenuOpen ? 'bg-foreground/12 text-foreground' : 'text-muted hover:text-foreground'
                  }`}
                >
                  <Plus size={18} />
                </button>
              </Tooltip>

              {addMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-hairline bg-surface-raised py-1.5 text-left shadow-2xl">
                    <AddMenuItem icon={Paperclip} label="파일 또는 사진 추가" onClick={handleAddFiles} />
                    <AddMenuItem icon={Camera} label="스크린샷 캡처하기" onClick={handleCaptureScreenshot} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Absolutely positioned so none of this participates in the page's flow layout — it was
          pushing/pulling everything below (including this very search bar, since the whole hero
          block is vertically centered) every time a panel appeared, disappeared, or resized.
          Also hidden entirely while recording, since the live interim transcript changes on every
          syllable and would otherwise flicker panels in and out even with the overlay fix. */}
      {!isRecording && (
        <div className="absolute inset-x-0 top-full z-30 mt-2">
      {showSuggestions && (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface text-left">
          {suggestions!.options.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectSuggestion(suggestions!.pathIds, opt)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors ${
                i === highlightIndex ? 'bg-foreground/8' : 'hover:bg-foreground/6'
              }`}
            >
              <span className="text-foreground">/{[...suggestions!.pathIds, opt.id].join('/')}</span>
              <span className="shrink-0 truncate text-xs text-muted">{opt.description}</span>
            </button>
          ))}
        </div>
      )}

      {showModelPicker && (
        <ModelPickerPanel
          view={modelView}
          highlightIndex={modelHighlight}
          selected={selectedModel}
          onHighlightChange={setModelHighlight}
          onSelectService={(id) => {
            setModelView(id)
            setModelHighlight(0)
          }}
          onSelectModel={selectModel}
          onBack={() => {
            setModelView('services')
            setModelHighlight(0)
          }}
        />
      )}

      {showModelSearch &&
        (modelSearchPickerOpen ? (
          <ModelPickerPanel
            view={modelView}
            highlightIndex={modelHighlight}
            selected={selectedModel}
            onHighlightChange={setModelHighlight}
            onSelectService={(id) => {
              setModelView(id)
              setModelHighlight(0)
            }}
            onSelectModel={selectModel}
            onBack={() => {
              setModelView('services')
              setModelHighlight(0)
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface text-left">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <ServiceIcon icon={SERVICES.find((s) => s.id === selectedModel.service)?.icon ?? null} />
                <span>{modelDestination}로 물어볼게요</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModelView(selectedModel.service)
                  setModelHighlight(
                    Math.max(
                      0,
                      MODELS_BY_SERVICE[selectedModel.service].findIndex((m) => m.id === selectedModel.modelId),
                    ),
                  )
                  setModelSearchPickerOpen(true)
                }}
                className="shrink-0 rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
              >
                모델 변경
              </button>
            </div>
            <p className="border-t border-hairline px-4 py-2 text-xs text-muted">
              "{commandChain!.query}" 질문 준비 완료 — 실제 API 연동 전, mock이에요.
            </p>
          </div>
        ))}

      {showFileSearch && (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface text-left">
          {!fileSearch.supported ? (
            <p className="px-4 py-3 text-sm text-muted">
              이 브라우저는 로컬 폴더 접근을 지원하지 않아요 (Chrome/Edge 권장).
            </p>
          ) : !hasSearchFolders ? (
            // 폴더를 여기서 고르게 하면 검색 한 번에 "어디서"와 "무엇을"을 같이 정해야 한다.
            // 잘 바뀌지 않는 쪽은 설정에 두고, 여기서는 그리로 보내기만 한다.
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm text-muted">검색할 폴더가 아직 없어요. 설정에서 한 번만 정해두면 돼요.</p>
              <button
                type="button"
                onClick={openFolderSettings}
                className="shrink-0 rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
              >
                폴더 설정 열기
              </button>
            </div>
          ) : fileSearch.indexing ? (
            <p className="px-4 py-3 text-sm text-muted">폴더 색인 중...</p>
          ) : fileResults.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">일치하는 파일이 없어요.</p>
          ) : (
            <>
              {fileSearch.systemFilesSkipped.length > 0 && (
                <p className="border-b border-hairline px-4 py-1.5 text-xs text-muted">
                  시스템 파일은 검색에서 제외했어요: {fileSearch.systemFilesSkipped.join(', ')}
                </p>
              )}
              <div ref={fileListRef} className={fileListExpanded ? 'max-h-64 overflow-y-auto' : undefined}>
                {visibleFileResults.map((f, i) => (
                  <div
                    key={`${f.folderName}/${f.path}`}
                    data-file-index={i}
                    // 마우스를 올리면 키보드 하이라이트도 같이 옮긴다 — 두 방식이 서로 다른 항목을
                    // 가리키면 Enter가 어디로 갈지 알 수 없다 (자동완성·모델 피커와 같은 규칙).
                    onMouseEnter={() => setFileHighlight(i)}
                    className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                      i === fileHighlight ? 'bg-foreground/8' : ''
                    }`}
                  >
                    <FileText size={16} className="shrink-0 text-muted" />
                    <button
                      type="button"
                      onClick={() => fileSearch.openFile(f.folderName, f.path)}
                      title="파일 열기"
                      className="min-w-0 flex-1 truncate text-left text-foreground transition-colors hover:text-accent-blue"
                    >
                      {f.name}
                    </button>
                    <span className="max-w-[30%] shrink-0 truncate text-xs text-muted">
                      {f.folderName}/{f.path}
                    </span>
                    {!f.readOnly && (
                      <button
                        type="button"
                        aria-label={`${f.name} 휴지통으로 이동`}
                        title="휴지통으로 이동"
                        onClick={() => {
                          if (window.confirm(`'${f.name}'을(를) 휴지통으로 옮길까요? '/파일/휴지통'에서 다시 복원할 수 있어요.`)) {
                            fileSearch.deleteFile(f.folderName, f.path)
                          }
                        }}
                        className="shrink-0 text-muted transition-colors hover:text-accent-blue"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {hiddenFileCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setFileListExpanded(true)}
                  className="flex w-full items-center justify-center gap-1 border-t border-hairline px-4 py-2 text-xs font-medium text-muted transition-colors hover:bg-foreground/6 hover:text-foreground"
                >
                  <ChevronDown size={14} />
                  {hiddenFileCount}개 더 보기
                </button>
              ) : (
                <p className="border-t border-hairline px-4 py-1.5 text-xs text-muted">↑ ↓ 로 고르고 Enter로 열어요</p>
              )}
            </>
          )}
          {fileSearch.error && (
            <p className="border-t border-hairline px-4 py-2 text-xs text-accent-blue">{fileSearch.error}</p>
          )}
        </div>
      )}

      {showTrash && (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface text-left">
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2">
            <p className="text-xs text-muted">
              {fileSearch.folders.length > 0
                ? `${fileSearch.folders.map((f) => f.name).join(', ')} 폴더의 휴지통`
                : '휴지통'}
            </p>
            {fileSearch.trashedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('휴지통을 비우면 전부 영구적으로 삭제돼요. 복구할 수 없어요. 계속할까요?')) {
                    fileSearch.emptyTrash()
                  }
                }}
                className="shrink-0 text-xs font-medium text-accent-blue transition-colors hover:brightness-110"
              >
                휴지통 비우기
              </button>
            )}
          </div>
          {fileSearch.trashedFiles.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">휴지통이 비어있어요.</p>
          ) : (
            fileSearch.trashedFiles.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 px-4 py-2 text-sm">
                <FileText size={16} className="shrink-0 text-muted" />
                <span className="flex-1 truncate text-foreground">{t.name}</span>
                <span className="max-w-[25%] shrink-0 truncate text-xs text-muted">
                  {t.folderName}/{t.originalPath}
                </span>
                <button
                  type="button"
                  onClick={() => fileSearch.restoreFile(t)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10"
                >
                  복원
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`'${t.name}'을(를) 영구적으로 삭제해요. 복구할 수 없어요. 계속할까요?`)) {
                      fileSearch.permanentlyDeleteFile(t)
                    }
                  }}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-accent-blue transition-colors hover:brightness-110"
                >
                  완전 삭제
                </button>
              </div>
            ))
          )}
          {fileSearch.error && <p className="px-4 py-2 text-xs text-accent-blue">{fileSearch.error}</p>}
        </div>
      )}

      {showStatusCommand && (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface p-4 text-left">
          {statusTask.phase === 'idle' && <p className="text-sm text-muted">Enter를 누르면 이 PC의 상태를 확인해요.</p>}
          {statusTask.phase === 'running' && (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Loader2 size={14} className="animate-spin" />
              {TASK_STATUS_LABELS[statusTask.status] ?? '처리하는 중이에요'}
            </p>
          )}
          {statusTask.phase === 'failed' && <p className="text-sm text-accent-blue">{statusTask.message}</p>}
          {statusTask.phase === 'done' && (
            <div className="flex flex-col gap-2">
              {(
                [
                  { label: 'CPU', percent: statusTask.result.cpuPercent, detail: null },
                  {
                    label: '메모리',
                    percent: statusTask.result.memoryPercent,
                    detail: `${statusTask.result.memoryUsedMb.toLocaleString()} / ${statusTask.result.memoryTotalMb.toLocaleString()} MB`,
                  },
                  {
                    label: '디스크',
                    percent: statusTask.result.diskPercent,
                    detail: `${statusTask.result.diskUsedMb.toLocaleString()} / ${statusTask.result.diskTotalMb.toLocaleString()} MB`,
                  },
                ] as const
              ).map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">{row.label}</span>
                  <span className="text-foreground">
                    {row.percent.toFixed(1)}%{row.detail ? ` · ${row.detail}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showPlaceholderMsg && <p className="pl-4 text-left text-xs text-muted">{placeholderMsg}</p>}

      {showDeepLinkHint && <p className="pl-4 text-left text-xs text-accent-blue">{deepLinkHintText}</p>}

      {showCommandModeHint && <p className="pl-4 text-left text-xs text-accent-blue">{commandModeHint}</p>}

      {showCommandHint && (
        <p className="pl-4 text-left text-xs text-accent-blue">
          명령어 모드 — Slash 명령으로 웹 검색을 직접 제어해요.
        </p>
      )}
      {/* 자유 입력은 `/모델`에서 고른 모델로 간다 — 그 선택이 실제로 어디에 쓰이는지 보이는 유일한
          자리이므로, 모델 이름을 고정 문구("로컬 LLM") 대신 여기에 그대로 적는다. 조사는 사용자가
          친 문장과 모델 이름 둘 다 뒤에 붙으므로 '이(가)'와 같은 병기 형태로 둔다 — 모델 이름이
          'o3', 'Gemini 3 Flash'처럼 받침 여부가 제각각이라 하나로 정할 수 없다.
          자유 입력은 로컬 에이전트를 거쳐 백엔드로 가므로, 에이전트가 꺼져있으면 보낼 곳 자체가
          없다는 걸 여기서 바로 알려준다 (§ Settings > 연동 > 지정 PC 관리). */}
      {isFreeText &&
        (agentStatus === 'offline' ? (
          <p className="pl-4 text-left text-xs text-accent-blue">
            로컬 에이전트가 꺼져있어서 요청을 보낼 수 없어요 ·{' '}
            <button
              type="button"
              onClick={() => navigate({ pathname: location.pathname, hash: '#settings/plugins' })}
              className="underline underline-offset-2 hover:brightness-110"
            >
              PC 관리에서 확인하기
            </button>
          </p>
        ) : (
          <p className="pl-4 text-left text-xs text-muted">
            '{trimmed}'이(가) {modelDestination}에 요청됩니다.
          </p>
        ))}
        </div>
      )}
    </div>
  )
}
