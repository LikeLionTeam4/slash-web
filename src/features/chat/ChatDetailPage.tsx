import { useParams, Link } from 'react-router'
import { ChevronDown, Share2, Copy, Volume2, ThumbsUp, ThumbsDown, RotateCcw, FileText, Globe, Download, CornerDownRight } from 'lucide-react'
import { Tooltip } from '../../components/Tooltip'
import { SearchBar } from '../../components/SearchBar'
import { findThread, type AssistantContent, type DownloadFile, type FileResult, type WebResult } from './mockThreads'

const ACTION_ICONS = [
  { icon: Copy, label: '복사' },
  { icon: Volume2, label: '읽어주기' },
  { icon: ThumbsUp, label: '좋아요' },
  { icon: ThumbsDown, label: '별로예요' },
  { icon: RotateCcw, label: '다시 생성' },
]

function FileResultRow({ item }: { item: FileResult }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl border border-hairline bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-raised"
    >
      <FileText size={18} className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">{item.name}</span>
        <span className="block truncate text-xs text-muted">{item.path}</span>
      </span>
    </button>
  )
}

function WebResultCard({ item }: { item: WebResult }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-3.5">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Globe size={12} className="text-accent-blue" />
        {item.domain}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{item.title}</p>
      <p className="mt-1 text-sm text-muted">{item.snippet}</p>
    </div>
  )
}

/** 목 파일이지만 내려받기는 진짜로 동작한다 — content를 그대로 Blob으로 만들어 넘긴다. */
function downloadMockFile(file: DownloadFile) {
  const url = URL.createObjectURL(new Blob([file.content], { type: file.mime }))
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

function DownloadCard({ file }: { file: DownloadFile }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-3.5">
      <FileText size={20} className="shrink-0 text-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{file.name}</span>
        <span className="block text-xs text-muted">{file.meta}</span>
      </span>
      <button
        type="button"
        onClick={() => downloadMockFile(file)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15"
      >
        <Download size={14} />
        내려받기
      </button>
    </div>
  )
}

function AssistantContentBlock({ content }: { content: AssistantContent }) {
  switch (content.type) {
    case 'file-results':
      return (
        <div className="flex flex-col gap-2">
          {content.items.map((f) => (
            <FileResultRow key={f.name} item={f} />
          ))}
        </div>
      )
    case 'web-results':
      return (
        <div className="flex flex-col gap-2">
          {content.items.map((w) => (
            <WebResultCard key={w.title} item={w} />
          ))}
        </div>
      )
    case 'route-steps':
      return (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
          <p className="border-b border-hairline px-3.5 py-2 text-xs font-medium text-accent-blue">{content.total}</p>
          {content.items.map((step) => (
            <div key={step.label} className="flex items-start gap-2.5 px-3.5 py-2.5">
              <CornerDownRight size={15} className="mt-0.5 shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block text-sm text-foreground">{step.label}</span>
                <span className="block text-xs text-muted">{step.detail}</span>
              </span>
            </div>
          ))}
        </div>
      )
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-xl border border-hairline bg-surface p-3.5 text-xs leading-relaxed text-foreground">
          <code>{content.code}</code>
        </pre>
      )
    case 'download':
      return <DownloadCard file={content.file} />
  }
}

function ThreadNotFound() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted">이 대화를 찾을 수 없어요. 지워졌거나 주소가 잘못된 것 같아요.</p>
      <Link
        to="/new"
        className="rounded-lg bg-foreground/10 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/15"
      >
        새로 검색하기
      </Link>
    </div>
  )
}

export function ChatDetailPage() {
  const { id } = useParams()
  const thread = findThread(id)

  if (!thread) return <ThreadNotFound />

  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <button type="button" className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground">
          <span className="truncate">{thread.title}</span>
          <ChevronDown size={16} className="shrink-0 text-muted" />
        </button>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-raised"
        >
          <Share2 size={14} />
          공유
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 py-6">
        {thread.items.map((item, i) =>
          item.role === 'user' ? (
            <div key={i} className="ml-auto max-w-lg rounded-2xl border border-hairline bg-surface p-4">
              {item.attachment && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-hairline bg-surface-raised p-2.5">
                  <FileText size={18} className="shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{item.attachment.name}</span>
                    <span className="block text-xs text-muted">{item.attachment.meta}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-foreground/8 px-1.5 py-0.5 text-2xs font-medium text-muted">
                    {item.attachment.format}
                  </span>
                </div>
              )}
              {/* 명령으로 물어본 대화는 검색바와 같은 모양으로 — 명령어는 칩, 값은 본문 */}
              {item.command && (
                <span className="mb-2 inline-block rounded-full bg-accent-blue/12 px-2.5 py-1 text-xs font-medium text-accent-blue">
                  {item.command.path.join('/')}
                </span>
              )}
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ) : (
            <div key={i} className="max-w-2xl">
              <p className="whitespace-pre-line text-control leading-relaxed text-foreground">{item.text}</p>

              {item.content && (
                <div className="mt-3">
                  <AssistantContentBlock content={item.content} />
                </div>
              )}

              <div className="mt-3 flex items-center gap-1">
                {ACTION_ICONS.map(({ icon: Icon, label }) => (
                  <Tooltip key={label} label={label}>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-raised hover:text-foreground"
                    >
                      <Icon size={15} />
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="sticky bottom-0 bg-canvas pb-2 pt-2">
        <SearchBar />
      </div>
    </div>
  )
}
