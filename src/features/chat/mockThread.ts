export type FileResult = { name: string; path: string }
export type WebResult = { title: string; domain: string; snippet: string }

export type ThreadItem =
  | { id: string; role: 'user'; text: string; attachment?: { name: string; meta: string; format: string } }
  | {
      id: string
      role: 'assistant'
      text: string
      content?: { type: 'file-results'; items: FileResult[] } | { type: 'web-results'; items: WebResult[] }
    }

export const MOCK_THREAD: ThreadItem[] = [
  {
    id: 'u1',
    role: 'user',
    text: '타입스크립트 제네릭 어떻게 써?',
  },
  {
    id: 'a1',
    role: 'assistant',
    text: '제네릭은 함수나 타입을 작성할 때 구체적인 타입을 나중에 정하도록 미뤄두는 문법이에요.\n예를 들어 `function identity<T>(value: T): T { return value }` 처럼 `<T>`로 타입 변수를 선언하면, 호출할 때 넘기는 값에 맞춰 타입이 자동으로 정해져요.',
  },
  {
    id: 'u2',
    role: 'user',
    text: '이 파일이랑 비슷한 이름의 파일 더 찾아줘',
    attachment: { name: '견적서.pdf', meta: '3페이지', format: 'PDF' },
  },
  {
    id: 'a2',
    role: 'assistant',
    text: '견적서.pdf와 이름이 비슷한 파일 2개를 찾았어요.',
    content: {
      type: 'file-results',
      items: [
        { name: '견적서_최종.pdf', path: 'Documents/2026' },
        { name: '견적서_수정본.xlsx', path: 'Documents/2026/보관' },
      ],
    },
  },
  {
    id: 'u3',
    role: 'user',
    text: '/검색/네이버 리액트 19 신규 기능',
  },
  {
    id: 'a3',
    role: 'assistant',
    text: '리액트 19의 주요 신규 기능을 웹에서 찾아봤어요.',
    content: {
      type: 'web-results',
      items: [
        {
          title: 'React 19 공식 릴리즈 노트',
          domain: 'react.dev',
          snippet: 'Actions, useActionState, useOptimistic 등 새로운 훅과 함께 서버 컴포넌트 지원이 안정화되었습니다.',
        },
        {
          title: 'React 19 마이그레이션 가이드',
          domain: 'ko.react.dev',
          snippet: '기존 프로젝트를 React 19로 업그레이드할 때 주의할 breaking change 목록을 정리했습니다.',
        },
        {
          title: 'React 19 vs 18 성능 비교',
          domain: 'velog.io',
          snippet: '컴파일러 최적화와 자동 배칭 개선으로 리렌더링 횟수가 줄어든 사례를 벤치마크와 함께 소개합니다.',
        },
      ],
    },
  },
]
