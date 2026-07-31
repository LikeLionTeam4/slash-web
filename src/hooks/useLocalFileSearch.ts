import { useCallback, useEffect, useRef, useState } from 'react'
import { loadFolderHandles, removeFolderHandle, saveFolderHandle } from '../lib/folderHandleStore'

export type LocalFileEntry = { name: string; path: string; folderName: string; readOnly?: boolean }
export type TrashEntry = {
  id: string
  name: string
  originalPath: string
  trashName: string
  deletedAt: number
  folderName: string
}
type ManifestEntry = Omit<TrashEntry, 'folderName'>

type GrantedFolder = {
  name: string
  root: FileSystemDirectoryHandleLike
  connected: boolean
  skippedSystemNames: string[]
}

// A folder added via <input webkitdirectory> instead of showDirectoryPicker — the only way to
// reach a top-level folder like Downloads itself, since that older API has no "sensitive
// directory" blocklist. Trade-off: it's a one-time snapshot (File blobs, not a live handle), so
// there's no delete/restore and no persisting/reconnecting across a reload — just search + open.
type ReadOnlyFolder = { name: string; fileCount: number; skippedSystemNames: string[] }

const MAX_INDEXED_FILES = 500
// 목록은 기본 10개만 보여주고 나머지는 '더 보기'로 펼친다(SearchBar) — 잘라내는 건 화면 쪽 일이라
// 여기서는 넉넉히 남긴다. 그래도 상한은 둔다: 색인 자체가 500개까지라 그 이상은 의미가 없다.
const MAX_RESULTS = 100
const TRASH_DIR_NAME = '.slash-trash'
const MANIFEST_NAME = '.manifest.json'

// OS-generated metadata files/folders — never useful as a search result, so skip indexing them.
const SYSTEM_ENTRY_NAMES = new Set([
  '.ds_store',
  '.localized',
  '.spotlight-v100',
  '.trashes',
  '.fseventsd',
  'thumbs.db',
  'desktop.ini',
  '$recycle.bin',
])

function isSystemEntry(name: string): boolean {
  return SYSTEM_ENTRY_NAMES.has(name.toLowerCase())
}

async function walk(
  dirHandle: FileSystemDirectoryHandleLike,
  prefix: string,
  folderName: string,
  entries: LocalFileEntry[],
  skipped: Set<string>,
): Promise<void> {
  for await (const [name, handle] of dirHandle.entries()) {
    if (name === TRASH_DIR_NAME) continue
    if (isSystemEntry(name)) {
      skipped.add(name)
      continue
    }
    if (entries.length >= MAX_INDEXED_FILES) return
    const path = prefix ? `${prefix}/${name}` : name
    if (handle.kind === 'file') {
      entries.push({ name, path, folderName })
    } else {
      await walk(handle as FileSystemDirectoryHandleLike, path, folderName, entries, skipped)
    }
  }
}

/** Splits a relative path into its parent directory's segments and the final file name. */
async function resolveParent(root: FileSystemDirectoryHandleLike, path: string) {
  const parts = path.split('/')
  const name = parts.pop()!
  let dir = root
  for (const part of parts) dir = await dir.getDirectoryHandle(part)
  return { parent: dir, name }
}

/** Recreates (if needed) and returns the directory at `parts` under `root`. */
async function ensureDirPath(root: FileSystemDirectoryHandleLike, parts: string[]) {
  let dir = root
  for (const part of parts) dir = await dir.getDirectoryHandle(part, { create: true })
  return dir
}

async function copyFileInto(source: FileSystemFileHandleLike, destDir: FileSystemDirectoryHandleLike, destName: string) {
  const file = await source.getFile()
  const destHandle = await destDir.getFileHandle(destName, { create: true })
  const writable = await destHandle.createWritable()
  await writable.write(file)
  await writable.close()
}

/** Reads the trash manifest (list of what's in `.slash-trash` and where it came from) — empty if missing/corrupt. */
async function readManifest(trashDir: FileSystemDirectoryHandleLike): Promise<ManifestEntry[]> {
  try {
    const handle = await trashDir.getFileHandle(MANIFEST_NAME)
    const text = await (await handle.getFile()).text()
    return JSON.parse(text)
  } catch {
    return []
  }
}

async function writeManifest(trashDir: FileSystemDirectoryHandleLike, entries: ManifestEntry[]): Promise<void> {
  const handle = await trashDir.getFileHandle(MANIFEST_NAME, { create: true })
  const writable = await handle.createWritable()
  await writable.write(JSON.stringify(entries))
  await writable.close()
}

function toManifestEntry(t: TrashEntry): ManifestEntry {
  return { id: t.id, name: t.name, originalPath: t.originalPath, trashName: t.trashName, deletedAt: t.deletedAt }
}

/**
 * Real local file search + delete across one or more folders the user explicitly grants access to
 * via the File System Access API (Chrome/Edge only). A single grant can never cover "the whole
 * disk" — Chrome refuses home/Desktop/Documents/Downloads themselves — so searching broadly when
 * you don't know where a file lives means adding several specific folders and querying all of them
 * at once, rather than one folder at a time.
 *
 * Granted folder handles are remembered in IndexedDB across reloads (handles are structured-clone
 * safe), so returning users only need to click "재연결" and re-grant permission — not re-pick the
 * folder from scratch. "Delete" moves a file into that folder's own `.slash-trash` subfolder (the
 * web platform has no API to move a file into the OS trash); a `.manifest.json` inside it records
 * each entry's original path so trash contents (and correct restore locations) survive a reload too.
 */
export function useLocalFileSearch() {
  const [folders, setFolders] = useState<GrantedFolder[]>([])
  const [readOnlyFolders, setReadOnlyFolders] = useState<ReadOnlyFolder[]>([])
  const [indexing, setIndexing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trashedFiles, setTrashedFiles] = useState<TrashEntry[]>([])
  const indexRef = useRef<LocalFileEntry[]>([])
  const trashedFilesRef = useRef<TrashEntry[]>([])
  const foldersRef = useRef<GrantedFolder[]>([])
  const readOnlyFilesRef = useRef<Map<string, File>>(new Map())
  const supported = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'

  useEffect(() => {
    foldersRef.current = folders
  }, [folders])

  const findRoot = useCallback(
    (folderName: string) => foldersRef.current.find((f) => f.name === folderName)?.root ?? null,
    [],
  )

  /** Indexes a folder's files and restores its trash list from `.manifest.json`, then marks it connected. */
  const connectFolder = useCallback(async (name: string, root: FileSystemDirectoryHandleLike) => {
    const entries: LocalFileEntry[] = []
    const skipped = new Set<string>()
    await walk(root, '', name, entries, skipped)
    indexRef.current = [...indexRef.current.filter((e) => e.folderName !== name), ...entries]

    let restoredTrash: TrashEntry[] = []
    try {
      const trashDir = await root.getDirectoryHandle(TRASH_DIR_NAME, { create: true })
      const manifest = await readManifest(trashDir)
      restoredTrash = manifest.map((m) => ({ ...m, folderName: name }))
    } catch {
      // no trash yet — fine
    }
    const nextTrash = [...trashedFilesRef.current.filter((t) => t.folderName !== name), ...restoredTrash]
    trashedFilesRef.current = nextTrash
    setTrashedFiles(nextTrash)

    setFolders((prev) =>
      prev.map((f) => (f.name === name ? { ...f, connected: true, skippedSystemNames: Array.from(skipped) } : f)),
    )
  }, [])

  // On mount, load any folders remembered from a previous visit. If the browser still considers
  // permission "granted" for this session, reconnect silently — otherwise leave them as
  // needs-reconnect until the user clicks "재연결" (requestPermission needs a user gesture anyway).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const remembered = await loadFolderHandles()
      if (cancelled || remembered.length === 0) return
      setFolders(remembered.map((f) => ({ name: f.name, root: f.root, connected: false, skippedSystemNames: [] })))
      for (const f of remembered) {
        if (cancelled) return
        const status = await f.root.queryPermission?.({ mode: 'readwrite' })
        if (status === 'granted') await connectFolder(f.name, f.root)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [connectFolder])

  /** Opens the native picker and adds the chosen folder to the search set (doesn't replace it). */
  const addFolder = useCallback(async () => {
    if (!window.showDirectoryPicker) return
    setError(null)
    try {
      // Chrome refuses to grant "다운로드" itself (see the error message below), but starting the
      // native picker there still saves a click for the very common case of a subfolder inside it.
      const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' })
      if (foldersRef.current.some((f) => f.name === handle.name)) {
        setError(`'${handle.name}' 폴더는 이미 검색 대상에 추가되어 있어요.`)
        return
      }
      setIndexing(true)
      setFolders((prev) => [...prev, { name: handle.name, root: handle, connected: false, skippedSystemNames: [] }])
      await saveFolderHandle(handle.name, handle)
      await connectFolder(handle.name, handle)
    } catch (e) {
      // AbortError = user clicked "취소" on the picker itself — not a real failure, stay quiet.
      if (e instanceof DOMException && e.name === 'AbortError') return
      // Chrome refuses "sensitive" top-level folders (home dir, Desktop, Downloads, etc.) for
      // File System Access — the fix is picking a more specific subfolder, not a code fix.
      setError('이 폴더는 선택할 수 없어요 (홈/바탕화면/다운로드 같은 최상위 폴더는 브라우저가 막아요). 더 구체적인 하위 폴더를 선택해보세요.')
    } finally {
      setIndexing(false)
    }
  }, [connectFolder])

  /** Re-requests permission on a remembered (but not yet reconnected) folder, then indexes it. */
  const reconnectFolder = useCallback(
    async (folderName: string) => {
      const folder = foldersRef.current.find((f) => f.name === folderName)
      if (!folder) return
      setError(null)
      try {
        const status = await folder.root.requestPermission?.({ mode: 'readwrite' })
        if (status !== 'granted') {
          setError('폴더에 다시 연결하려면 접근 권한을 허용해야 해요.')
          return
        }
        setIndexing(true)
        await connectFolder(folderName, folder.root)
      } catch {
        setError('폴더에 다시 연결하지 못했어요.')
      } finally {
        setIndexing(false)
      }
    },
    [connectFolder],
  )

  /** Drops one granted folder (and its indexed files) from the search set — forgets it for next time too. */
  const removeFolder = useCallback((folderName: string) => {
    indexRef.current = indexRef.current.filter((f) => f.folderName !== folderName)
    setFolders((prev) => prev.filter((f) => f.name !== folderName))
    const nextTrash = trashedFilesRef.current.filter((t) => t.folderName !== folderName)
    trashedFilesRef.current = nextTrash
    setTrashedFiles(nextTrash)
    removeFolderHandle(folderName)
  }, [])

  /**
   * Adds a folder from an `<input webkitdirectory>` file picker — the only way to reach a
   * top-level folder like Downloads itself, at the cost of read-only, one-time-snapshot access.
   */
  const addReadOnlyFolder = useCallback((fileList: FileList) => {
    if (fileList.length === 0) return
    const topFolder = fileList[0].webkitRelativePath.split('/')[0] || '선택한 폴더'
    if (
      foldersRef.current.some((f) => f.name === topFolder) ||
      readOnlyFolders.some((f) => f.name === topFolder)
    ) {
      setError(`'${topFolder}' 폴더는 이미 검색 대상에 추가되어 있어요.`)
      return
    }
    const entries: LocalFileEntry[] = []
    const skipped = new Set<string>()
    for (const file of Array.from(fileList)) {
      if (isSystemEntry(file.name)) {
        skipped.add(file.name)
        continue
      }
      if (entries.length >= MAX_INDEXED_FILES) break
      const path = file.webkitRelativePath.split('/').slice(1).join('/') || file.name
      entries.push({ name: file.name, path, folderName: topFolder, readOnly: true })
      readOnlyFilesRef.current.set(`${topFolder}/${path}`, file)
    }
    indexRef.current = [...indexRef.current, ...entries]
    setReadOnlyFolders((prev) => [...prev, { name: topFolder, fileCount: entries.length, skippedSystemNames: Array.from(skipped) }])
  }, [readOnlyFolders])

  /** Drops one read-only folder (and its indexed files) from the search set. */
  const removeReadOnlyFolder = useCallback((folderName: string) => {
    indexRef.current = indexRef.current.filter((f) => f.folderName !== folderName)
    for (const key of Array.from(readOnlyFilesRef.current.keys())) {
      if (key.startsWith(`${folderName}/`)) readOnlyFilesRef.current.delete(key)
    }
    setReadOnlyFolders((prev) => prev.filter((f) => f.name !== folderName))
  }, [])

  /** Opens a file in a new tab via an object URL — the browser renders it if it can, downloads it otherwise. */
  const openFile = useCallback(
    async (folderName: string, path: string) => {
      const cachedFile = readOnlyFilesRef.current.get(`${folderName}/${path}`)
      if (cachedFile) {
        const url = URL.createObjectURL(cachedFile)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        return
      }
      const root = findRoot(folderName)
      if (!root) return
      try {
        const { parent, name } = await resolveParent(root, path)
        const fileHandle = await parent.getFileHandle(name)
        const file = await fileHandle.getFile()
        const url = URL.createObjectURL(file)
        window.open(url, '_blank')
        // Give the new tab time to actually load the blob before we free it.
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } catch {
        setError('파일을 열지 못했어요.')
      }
    },
    [findRoot],
  )

  /** Searches across every connected folder's index at once. */
  const search = useCallback((query: string): LocalFileEntry[] => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return indexRef.current.filter((f) => f.name.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
  }, [])

  /** Moves a file (by folder + path from `search`) into that folder's `.slash-trash`. */
  const deleteFile = useCallback(
    async (folderName: string, path: string) => {
      const root = findRoot(folderName)
      if (!root) return
      try {
        if (root.requestPermission) {
          const status = await root.requestPermission({ mode: 'readwrite' })
          if (status !== 'granted') {
            setError('삭제하려면 이 폴더에 쓰기 권한을 허용해야 해요.')
            return
          }
        }
        const { parent, name } = await resolveParent(root, path)
        const fileHandle = await parent.getFileHandle(name)
        const trashDir = await root.getDirectoryHandle(TRASH_DIR_NAME, { create: true })
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const trashName = `${id}__${name}`
        await copyFileInto(fileHandle, trashDir, trashName)
        await parent.removeEntry(name)
        indexRef.current = indexRef.current.filter((f) => !(f.folderName === folderName && f.path === path))

        const newEntry: TrashEntry = { id, name, originalPath: path, trashName, deletedAt: Date.now(), folderName }
        const next = [...trashedFilesRef.current, newEntry]
        trashedFilesRef.current = next
        setTrashedFiles(next)
        await writeManifest(trashDir, next.filter((t) => t.folderName === folderName).map(toManifestEntry))
      } catch {
        setError('파일을 휴지통으로 옮기지 못했어요.')
      }
    },
    [findRoot],
  )

  /** Copies a trashed file back to its original path (in its own folder) and removes it from `.slash-trash`. */
  const restoreFile = useCallback(
    async (entry: TrashEntry) => {
      const root = findRoot(entry.folderName)
      if (!root) return
      try {
        const trashDir = await root.getDirectoryHandle(TRASH_DIR_NAME, { create: true })
        const trashHandle = await trashDir.getFileHandle(entry.trashName)
        const parts = entry.originalPath.split('/')
        const name = parts.pop()!
        const parentDir = await ensureDirPath(root, parts)
        await copyFileInto(trashHandle, parentDir, name)
        await trashDir.removeEntry(entry.trashName)

        const next = trashedFilesRef.current.filter((t) => t.id !== entry.id)
        trashedFilesRef.current = next
        setTrashedFiles(next)
        await writeManifest(trashDir, next.filter((t) => t.folderName === entry.folderName).map(toManifestEntry))

        indexRef.current = [...indexRef.current, { name, path: entry.originalPath, folderName: entry.folderName }]
      } catch {
        setError('파일을 복원하지 못했어요.')
      }
    },
    [findRoot],
  )

  /** Permanently removes one trashed file — caller must confirm with the user first, this doesn't ask. */
  const permanentlyDeleteFile = useCallback(
    async (entry: TrashEntry) => {
      const root = findRoot(entry.folderName)
      if (!root) return
      try {
        const trashDir = await root.getDirectoryHandle(TRASH_DIR_NAME, { create: true })
        await trashDir.removeEntry(entry.trashName)

        const next = trashedFilesRef.current.filter((t) => t.id !== entry.id)
        trashedFilesRef.current = next
        setTrashedFiles(next)
        await writeManifest(trashDir, next.filter((t) => t.folderName === entry.folderName).map(toManifestEntry))
      } catch {
        setError('완전히 삭제하지 못했어요.')
      }
    },
    [findRoot],
  )

  /** Permanently removes every trashed file across every folder — caller must confirm first. */
  const emptyTrash = useCallback(async () => {
    for (const entry of trashedFiles) {
      await permanentlyDeleteFile(entry)
    }
  }, [trashedFiles, permanentlyDeleteFile])

  const systemFilesSkipped = Array.from(
    new Set([...folders.flatMap((f) => f.skippedSystemNames), ...readOnlyFolders.flatMap((f) => f.skippedSystemNames)]),
  )

  return {
    supported,
    folders,
    readOnlyFolders,
    indexing,
    error,
    trashedFiles,
    systemFilesSkipped,
    addFolder,
    reconnectFolder,
    removeFolder,
    addReadOnlyFolder,
    removeReadOnlyFolder,
    openFile,
    search,
    deleteFile,
    restoreFile,
    permanentlyDeleteFile,
    emptyTrash,
  }
}
