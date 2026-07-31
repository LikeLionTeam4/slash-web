import { createContext, useContext, type ReactNode } from 'react'
import { useLocalFileSearch } from './useLocalFileSearch'

type FileSearch = ReturnType<typeof useLocalFileSearch>

const FileSearchContext = createContext<FileSearch | null>(null)

/**
 * 폴더 접근 권한과 색인을 앱 전체가 하나만 들고 있게 한다.
 * 폴더는 설정에서 추가하고 검색은 검색바에서 하는데, 훅을 각자 부르면 서로 다른 상태가 되어
 * 설정에서 방금 추가한 폴더가 검색바에는 없는 폴더가 된다. 색인도 한 번만 돌면 된다.
 */
export function FileSearchProvider({ children }: { children: ReactNode }) {
  const value = useLocalFileSearch()
  return <FileSearchContext.Provider value={value}>{children}</FileSearchContext.Provider>
}

export function useFileSearch(): FileSearch {
  const value = useContext(FileSearchContext)
  if (!value) throw new Error('useFileSearch는 FileSearchProvider 안에서만 쓸 수 있어요.')
  return value
}
