// Mock slash-command chaining (`/네임스페이스/액션 쿼리`) for frontend-only UX testing.
// `파일/검색` (useLocalFileSearch) and `모델/검색` (SearchBar's model chip/picker) are real —
// this file only covers commands with no backend/API yet. Don't ship this data as real.

export type ChainedCommand = { namespace: string; action: string; query: string }

/** Parses `/네임스페이스/액션 쿼리` — returns null if the input isn't a two-segment chain. */
export function parseCommandChain(input: string): ChainedCommand | null {
  const match = input.match(/^\/([^\s/]+)\/([^\s/]+)\s+(.+)/)
  if (!match) return null
  const [, namespace, action, query] = match
  return { namespace, action, query }
}

/** Chains with a real implementation elsewhere (SearchBar checks these before falling back to this file). */
const REAL_CHAINS = new Set(['파일/검색', '모델/검색'])

/** Placeholder message for any registered chain that isn't in REAL_CHAINS yet. */
export function mockPlaceholderMessage(chain: ChainedCommand): string | null {
  const key = `${chain.namespace}/${chain.action}`
  return REAL_CHAINS.has(key) ? null : '이 기능은 아직 준비 중이에요.'
}
