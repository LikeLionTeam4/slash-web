// Persists granted FileSystemDirectoryHandle objects across page reloads (they're structured-clone
// safe, so IndexedDB can store them directly). The browser still requires re-requesting permission
// on each fresh page load — this just lets that be a one-click "재연결" instead of re-picking the
// folder from scratch every time.
const DB_NAME = 'slash-file-search'
const STORE_NAME = 'folders'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'name' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveFolderHandle(name: string, root: FileSystemDirectoryHandleLike): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put({ name, root })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function loadFolderHandles(): Promise<{ name: string; root: FileSystemDirectoryHandleLike }[]> {
  const db = await openDb()
  const result = await new Promise<{ name: string; root: FileSystemDirectoryHandleLike }[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result
}

export async function removeFolderHandle(name: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(name)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
