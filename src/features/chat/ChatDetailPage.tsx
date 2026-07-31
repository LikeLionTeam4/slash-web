import { ChevronDown, Share2, Copy, Volume2, ThumbsUp, ThumbsDown, RotateCcw, FileText, Globe } from 'lucide-react'
import { Tooltip } from '../../components/Tooltip'
import { SearchBar } from '../../components/SearchBar'
import { MOCK_THREAD, type FileResult, type WebResult } from './mockThread'

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

export function ChatDetailPage() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          타입스크립트 제네릭 질문
          <ChevronDown size={16} className="text-muted" />
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-raised"
        >
          <Share2 size={14} />
          공유
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 py-6">
        {MOCK_THREAD.map((item) =>
          item.role === 'user' ? (
            <div key={item.id} className="ml-auto max-w-lg rounded-2xl border border-hairline bg-surface p-4">
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
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ) : (
            <div key={item.id} className="max-w-2xl">
              <p className="whitespace-pre-line text-control leading-relaxed text-foreground">{item.text}</p>

              {item.content?.type === 'file-results' && (
                <div className="mt-3 flex flex-col gap-2">
                  {item.content.items.map((f) => (
                    <FileResultRow key={f.name} item={f} />
                  ))}
                </div>
              )}

              {item.content?.type === 'web-results' && (
                <div className="mt-3 flex flex-col gap-2">
                  {item.content.items.map((w) => (
                    <WebResultCard key={w.title} item={w} />
                  ))}
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
