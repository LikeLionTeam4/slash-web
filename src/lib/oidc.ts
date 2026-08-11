// slash-api 연동 규약(frontend-api-contract.md §5) 기준 설정.
//   - Authorization Code + PKCE만 쓴다 (Implicit 금지)
//   - scope에 email이 반드시 있어야 한다 — 없으면 서버가 최초 로그인 때 사용자 레코드를
//     못 만들어서 실패한다
//   - 저장 위치는 원래 "Access Token은 메모리, Refresh Token만 localStorage"가 목표지만,
//     계약서가 "P0 범위에서는 oidc-client-ts 기본값을 그대로 쓴다"고 명시했으므로 커스텀
//     스토리지 분리 없이 WebStorageStateStore(localStorage) 기본값을 그대로 쓴다. 대신
//     Access Token 수명을 60분으로 짧게 잡아(modules/cognito) 노출 시간을 줄인다.
import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

const region = import.meta.env.VITE_COGNITO_REGION
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID

export const userManager = new UserManager({
  authority: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid email profile',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // 만료 5분 전 선제 갱신(계약서 §5). 리프레시 토큰이 있으면 iframe 없이 그 토큰으로
  // 조용히 갱신한다.
  automaticSilentRenew: true,
  accessTokenExpiringNotificationTimeInSeconds: 5 * 60,
  // 이메일은 서버가 Cognito userInfo로 직접 조회하는 게 계약(§5) — 프론트가 중복으로
  // userinfo 엔드포인트를 호출할 필요가 없다.
  loadUserInfo: false,
})

/**
 * Cognito는 표준 OIDC 로그아웃(`end_session_endpoint`에 `id_token_hint`)을 지원하지 않는다 —
 * 실제로 붙여보면 `/login` 페이지로 잘못 튕겨서 멈춘다(2026-08-05 확인). `userManager.signoutRedirect()`
 * 대신 Cognito 고유 방식(`client_id`+`logout_uri`)으로 직접 URL을 만들어야 한다.
 */
export function cognitoSignOutUrl(): string {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID
  const logoutUri = encodeURIComponent(window.location.origin)
  return `${domain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`
}
