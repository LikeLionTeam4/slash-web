// 로그인 여부만 들고 있는 임시 상태. 백엔드 세션/토큰이 생기면 이 파일을 갈아끼우면 된다.
// localStorage를 쓰는 건 useTheme과 같은 이유 — 새로고침해도 남아 있어야 "로그인한 상태"라는
// 말이 성립하기 때문이다. 실제 인증이 아니므로 보안 목적으로 신뢰해선 안 된다.
//
// 참고: 아직 라우트 가드는 없다. /new에 직접 접속하면 로그인 없이도 열린다.

const STORAGE_KEY = 'slash-logged-in'

export function isLoggedIn(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setLoggedIn() {
  localStorage.setItem(STORAGE_KEY, 'true')
}

export function clearLogin() {
  localStorage.removeItem(STORAGE_KEY)
}

/** 워드마크(로고+Slash)를 눌렀을 때 갈 곳. 로그인했으면 앱으로, 아니면 로그인 화면으로. */
export function homePathForSession(): string {
  return isLoggedIn() ? '/new' : '/login'
}
