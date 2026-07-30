import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Mic, AudioLines, Paperclip, Camera, Plus, ArrowUp, X, FileText, ChevronDown, Trash2 } from 'lucide-react'
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
import { useLocalFileSearch } from '../hooks/useLocalFileSearch'

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

/** 목적격 조사 — 받침이 있으면 '을', 없으면 '를'. ('검색어를 입력' / '파일 이름을 입력') */
function withObjectParticle(noun: string): string {
  const code = noun.charCodeAt(noun.length - 1)
  const hasFinalConsonant = code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0
  return `${noun}${hasFinalConsonant ? '을' : '를'}`
}

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
  const [modelView, setModelView] = useState<ModelView>('services')
  const [modelHighlight, setModelHighlight] = useState(0)
  const [selectedModel, setSelectedModel] = useState<SelectedModel>({ service: 'claude', modelId: 'sonnet-5' })
  const [modelSearchPickerOpen, setModelSearchPickerOpen] = useState(false)
  // 값을 받는 명령(`/네이버`, `/구글`, `/파일`, `/네이버/길찾기` …)은 명령어 텍스트를 입력창에
  // 남겨두지 않고 칩으로 뺀다. path = 명령어 경로, operands = 이미 확정된 값(칩).
  // 지금 입력 중인 값은 `value`에 있다 — 명령어와 검색어는 한 문자열로 합치지 않고 끝까지 따로
  // 들고 있다가 백엔드에도 따로 보낸다.
  const [commandMode, setCommandMode] = useState<{ path: string[]; operands: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const readOnlyFolderInputRef = useRef<HTMLInputElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const fileSearch = useLocalFileSearch()
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
  const currentServiceLabel = SERVICES.find((s) => s.id === selectedModel.service)?.label ?? ''
  const currentModelLabel =
    MODELS_BY_SERVICE[selectedModel.service].find((m) => m.id === selectedModel.modelId)?.label ?? ''

  const showModelPicker = commandMode === null && trimmed === '/모델'
  const showTrash = commandMode === null && trimmed === '/파일/휴지통'
  const showSuggestions = !!suggestions && !showModelPicker && !showTrash
  const showFileSearch = !showSuggestions && !showModelPicker && !showTrash && isFileSearchCommand
  const showModelSearch =
    !showSuggestions && !showModelPicker && !showTrash && !showFileSearch && isModelSearchCommand
  const showCommandModeHint = !!commandModeHint
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
    !showFileSearch &&
    !showModelSearch &&
    !showPlaceholderMsg &&
    !showDeepLinkHint &&
    !showCommandModeHint &&
    isCommand
  const modelPickerActive = showModelPicker || (showModelSearch && modelSearchPickerOpen)

  useEffect(() => {
    setHighlightIndex(0)
  }, [value])

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

  // 딥링크 명령(/네이버/지도, /네이버/길찾기)은 결과가 앱 밖 새 탭에서 열린다 — 이슈 #6의 방식 1.
  // window.open은 클릭/Enter 같은 사용자 제스처 안에서 호출해야 팝업 차단을 피할 수 있다.
  function openDeepLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
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
        setSelectedModel({ service: modelView, modelId: MODELS_BY_SERVICE[modelView][modelHighlight].id })
        setModelSearchPickerOpen(false)
      }
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
      {/* webkitdirectory isn't a typed JSX prop — set it imperatively via the ref instead. Unlike
          showDirectoryPicker, this older API has no "sensitive directory" blocklist, so it's the
          only way to reach a top-level folder like Downloads itself (read-only trade-off). */}
      <input
        ref={(el) => {
          readOnlyFolderInputRef.current = el
          el?.setAttribute('webkitdirectory', '')
        }}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) fileSearch.addReadOnlyFolder(e.target.files)
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
                      <span className="w-full truncate text-center text-[10px] text-muted">{a.name}</span>
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
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted focus:outline-none"
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
          onSelectModel={(modelId) => setSelectedModel({ service: modelView as Exclude<ModelView, 'services'>, modelId })}
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
            onSelectModel={(modelId) => {
              setSelectedModel({ service: modelView as Exclude<ModelView, 'services'>, modelId })
              setModelSearchPickerOpen(false)
            }}
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
                <span>
                  {currentServiceLabel} · {currentModelLabel}로 물어볼게요
                </span>
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
          ) : fileSearch.folders.length === 0 && fileSearch.readOnlyFolders.length === 0 ? (
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">검색할 폴더를 먼저 선택해주세요. 여러 폴더를 추가하면 한 번에 검색할 수 있어요.</p>
                <button
                  type="button"
                  onClick={fileSearch.addFolder}
                  className="shrink-0 rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
                >
                  폴더 선택
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                홈 폴더·바탕화면·다운로드 같은 최상위 폴더는 브라우저가 막아요 — 그 안의 구체적인 하위 폴더들을 여러 개 추가해보세요.
              </p>
              <button
                type="button"
                onClick={() => readOnlyFolderInputRef.current?.click()}
                className="mt-2 text-xs font-medium text-accent-blue transition-colors hover:brightness-110"
              >
                다운로드처럼 최상위 폴더 자체를 검색하고 싶다면 (읽기 전용) →
              </button>
              {fileSearch.error && <p className="mt-1 text-xs text-accent-blue">{fileSearch.error}</p>}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-2">
                {fileSearch.folders.map((f) =>
                  f.connected ? (
                    <span
                      key={f.name}
                      className="flex items-center gap-1.5 rounded-full bg-foreground/8 py-1 pl-2.5 pr-1.5 text-xs text-foreground"
                    >
                      {f.name}
                      <button
                        type="button"
                        aria-label={`${f.name} 검색 대상에서 제거`}
                        title="검색 대상에서 제거"
                        onClick={() => fileSearch.removeFolder(f.name)}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-accent-blue"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ) : (
                    <span
                      key={f.name}
                      className="flex items-center gap-1.5 rounded-full border border-dashed border-hairline py-1 pl-2.5 pr-1.5 text-xs text-muted"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={() => fileSearch.reconnectFolder(f.name)}
                        className="font-medium text-accent-blue transition-colors hover:brightness-110"
                      >
                        재연결
                      </button>
                      <button
                        type="button"
                        aria-label={`${f.name} 검색 대상에서 제거`}
                        title="검색 대상에서 제거"
                        onClick={() => fileSearch.removeFolder(f.name)}
                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-accent-blue"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ),
                )}
                {fileSearch.readOnlyFolders.map((f) => (
                  <span
                    key={f.name}
                    title="읽기 전용 — 삭제 불가, 새로고침하면 다시 추가해야 해요"
                    className="flex items-center gap-1.5 rounded-full bg-foreground/8 py-1 pl-2.5 pr-1.5 text-xs text-muted"
                  >
                    {f.name} (읽기 전용)
                    <button
                      type="button"
                      aria-label={`${f.name} 검색 대상에서 제거`}
                      title="검색 대상에서 제거"
                      onClick={() => fileSearch.removeReadOnlyFolder(f.name)}
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-accent-blue"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={fileSearch.addFolder}
                  className="shrink-0 text-xs font-medium text-foreground transition-colors hover:text-accent-blue"
                >
                  + 폴더 추가
                </button>
                <button
                  type="button"
                  onClick={() => readOnlyFolderInputRef.current?.click()}
                  title="다운로드처럼 최상위 폴더 자체는 읽기 전용으로만 추가할 수 있어요"
                  className="shrink-0 text-xs font-medium text-muted transition-colors hover:text-accent-blue"
                >
                  + 최상위 폴더 (읽기 전용)
                </button>
              </div>

              {fileSearch.systemFilesSkipped.length > 0 && (
                <p className="border-b border-hairline px-4 py-1.5 text-xs text-muted">
                  시스템 파일은 검색에서 제외했어요: {fileSearch.systemFilesSkipped.join(', ')}
                </p>
              )}

              {fileSearch.indexing ? (
                <p className="px-4 py-3 text-sm text-muted">폴더 색인 중...</p>
              ) : (
                <>
                  {fileResults.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted">일치하는 파일이 없어요.</p>
                  ) : (
                    fileResults.map((f) => (
                      <div key={`${f.folderName}/${f.path}`} className="flex items-center gap-2.5 px-4 py-2 text-sm">
                        <FileText size={16} className="shrink-0 text-muted" />
                        <button
                          type="button"
                          onClick={() => fileSearch.openFile(f.folderName, f.path)}
                          title="파일 열기"
                          className="min-w-0 flex-1 truncate text-left text-foreground transition-colors hover:text-accent-blue hover:underline"
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
                    ))
                  )}
                  {fileSearch.error && <p className="px-4 py-2 text-xs text-accent-blue">{fileSearch.error}</p>}
                </>
              )}
            </>
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

      {showPlaceholderMsg && <p className="pl-4 text-left text-xs text-muted">{placeholderMsg}</p>}

      {showDeepLinkHint && <p className="pl-4 text-left text-xs text-accent-blue">{deepLinkHintText}</p>}

      {showCommandModeHint && <p className="pl-4 text-left text-xs text-accent-blue">{commandModeHint}</p>}

      {showCommandHint && (
        <p className="pl-4 text-left text-xs text-accent-blue">
          명령어 모드 — Slash 명령으로 웹 검색을 직접 제어해요.
        </p>
      )}
      {isFreeText && (
        <p className="pl-4 text-left text-xs text-muted">'{trimmed}'이(가) 로컬 LLM으로 요청됩니다.</p>
      )}
        </div>
      )}
    </div>
  )
}
