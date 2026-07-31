import { Navigate, Outlet } from 'react-router'
import { isLoggedIn } from '../../lib/auth'

/**
 * 로그인해야 볼 수 있는 라우트를 감싸는 레이아웃 라우트.
 * 자식 라우트는 `<Outlet />` 자리에 그려지고, 로그인 상태가 아니면 대신 /login으로 보낸다.
 *
 * replace를 쓰는 이유 — 막힌 주소를 히스토리에 남기면 로그인 화면에서 뒤로 가기를 눌렀을 때
 * 다시 그 주소로 갔다가 또 튕겨나오는 왕복이 생긴다.
 *
 * 로그인 상태는 localStorage에서 동기적으로 읽으므로 로딩 상태가 필요 없다. 백엔드 세션으로
 * 바뀌어 확인이 비동기가 되면, 판정 전에 잠깐 보여줄 상태가 여기 필요해진다.
 */
export function RequireAuth() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  return <Outlet />
}
