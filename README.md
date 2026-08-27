# Slash

자연어 질문과 `/` 슬래시 명령어를 한 입력창에서 함께 쓰는 AI 비서 프론트엔드입니다. `/`는 이 프로덕트의 이름이자 로고이자 명령어 트리거예요 — 평범한 문장을 입력하면 로컬(브라우저) LLM 또는 서버로, `/`로 시작하면 파일 검색·PC 상태 확인·AI 모델 선택 같은 명시적 명령으로 이어집니다.

## 기술 스택

- [Vite](https://vite.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`)
- React Router (해시 기반 다이얼로그 라우팅: 설정/명령어 가이드/단축키 + `/login`, `/new`, `/chat/:id`, `/dashboard`, `/history` 페이지 라우팅)
- `oidc-client-ts` — Cognito Hosted UI 기반 OIDC PKCE 로그인
- `@mlc-ai/web-llm` — 브라우저 내장(WebGPU) 요약 모델 실행
- `lucide-react` 아이콘, `@microsoft/clarity` 사용성 분석

Next.js/CRA가 아니라 Vite 기반 정적 SPA이며, 최종 배포는 S3/CloudFront 같은 정적 호스팅을 목표로 합니다 (백엔드 서버 없음).

## 시작하기

### 로컬에서 바로 실행

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build     # 타입체크 + 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
npm run test      # WebLLM 요약 스모크 테스트 (scripts/test-webllm-summary.mjs)
npm run test:auth # OIDC 세션 스모크 테스트 (scripts/test-auth-session.mjs)
```

### Docker Compose로 실행

```bash
docker compose up
```

`http://localhost:5173`에서 접속하면 됩니다. 소스 코드가 볼륨으로 마운트되어 있어서 코드를 수정하면 바로 반영돼요 (`node_modules`는 컨테이너 전용 볼륨으로 분리되어 있어 호스트 OS와 충돌하지 않습니다).

## 주요 기능

### 로그인

Cognito Hosted UI로 리다이렉트하는 OIDC(PKCE) 로그인입니다(`src/hooks/authContext.tsx`, `oidc-client-ts`) — 이메일 입력·인증코드 단계는 이 화면이 직접 그리지 않고 Cognito Managed Login이 담당합니다. 로그아웃은 표준 OIDC 로그아웃을 Cognito가 지원하지 않아 refresh token 폐기 후 Cognito 전용 로그아웃 URL로 직접 이동하는 방식으로 처리합니다.

### 검색창 (두 가지 모드, 한 입력창)

- **자연어 모드**: 그냥 질문을 입력하면 처리로 전달돼요 (플레이스홀더 헬퍼 텍스트로 안내).
- **명령어 모드**: `/`로 시작하면 자동완성 트리가 뜨고, 명령 실행으로 취급돼요 (입력창의 `/` 배지와 제출 버튼이 파란색으로 바뀝니다).
- IME(한글/일본어/중국어) 조합 중 Enter 오작동 방지, 음성 입력(Web Speech API, 길게 눌러 녹음 / 클릭 토글), 파일·스크린샷 첨부를 지원합니다.

### 슬래시 명령어 트리 (`src/lib/commandTree.ts`)

`/`만 입력하면 전부 검색이라는 의미라, "검색"이라는 세그먼트를 따로 두지 않습니다(2026-07-30 정리) — 같은 서비스명은 위치에 상관없이 항상 같은 뜻이 되도록 트리를 평탄화했습니다.

| 명령 | 설명 |
| --- | --- |
| `/파일 <파일 이름>` | 선택한 폴더에서 파일 이름으로 검색 |
| `/파일/휴지통` | 삭제한 파일 보기 · 복원 · 완전 삭제 |
| `/모델` | 답변에 쓸 AI 서비스·모델 선택 (Claude/ChatGPT/Gemini/Antigravity → 세부 모델, 2단계 패널) |
| `/상태` | 페어링된 PC의 CPU·메모리·디스크 사용량 확인 |
| `/코드 <질문>` | 등록한 프로젝트 폴더를 읽기 전용으로 분석 |
| `/사용량/클로드`, `/사용량/코덱스` | Claude Code·Codex CLI의 로컬 사용량 확인 |
| `/네이버 <검색어>` | 네이버 통합검색 |
| `/네이버/지도 <장소>`, `/네이버/길찾기 <출발지> <도착지>` | 네이버 지도·길찾기 |
| `/구글 <검색어>` | 구글 검색 |
| `/날씨 <지역>` | 지역 날씨 (네이버 하위가 아니라 최상위 — 네이버조차 외부 기상 API를 그대로 보여주는 것이라 "어느 서비스로 볼지" 물을 이유가 없어서) |
| `/요약 <내용>` | 긴 텍스트 요약 (150자 이상, 아래 "브라우저 요약" 참고) |

사이드바의 **명령어 가이드**에서 전체 트리와 단축키를 확인할 수 있고, 홈 화면의 예시 칩(`src/lib/exampleCommands.ts`)을 클릭하면 해당 명령어가 입력창에 바로 채워집니다.

### 지정 PC 페어링 & 파일 검색 (`src/lib/pairing.ts`, `src/lib/devices.ts`)

브라우저가 직접 사용자 파일시스템에 접근하지 않고, **사용자 PC에서 도는 로컬 에이전트(slash-runner)를 페어링**해서 그 PC의 파일을 검색합니다.

- **페어링**: 설정 → 지정 PC 관리에서 페어링 코드를 발급받아(`POST /api/v1/pairing-requests`) slash-runner에 입력하면, 상태가 `PENDING → CLAIMED`로 바뀌며 기기 목록에 등록됩니다.
- **기기 상태**: `READY`/`ONLINE`/`BUSY`/`OFFLINE` — 이름·OS·에이전트 버전·마지막 접속 시각을 확인할 수 있습니다.
- **작업 수신 토글**: 연결은 유지한 채 새 작업만 안 받도록 켜고 끌 수 있습니다(연결 해제와 별개로 되돌릴 수 있음).
- **해제**: 등록 해제는 되돌릴 수 없고, 서버가 그 자리에서 연결도 함께 끊습니다.
- `/파일` 검색은 이렇게 등록된 PC 중 서버가 고른 폴더(`searchFolderId`)를 대상으로 실행되고, 결과 카드의 "위치 보기"를 누르면 해당 파일을 엽니다.

### 브라우저 요약 (`/요약`, WebLLM)

WebGPU를 지원하는 브라우저는 `/요약 <긴 글>`을 서버로 보내지 않고 이 브라우저
안에서 직접 요약합니다([`@mlc-ai/web-llm`](https://github.com/mlc-ai/web-llm) +
Qwen2.5-1.5B-Instruct, 4bit 양자화).

- **원문이 브라우저 밖으로 나가지 않습니다.** 모델 다운로드(최초 1회, 약 830MB,
  브라우저 캐시)·추론 전부 이 탭 안에서 끝나고, 서버에는 요약 **결과**만
  제출해 작업 이력에 남깁니다(원문·본문 자체는 전송 안 함).
- 별도 설치가 필요 없습니다 — WebGPU 지원 브라우저면 자동으로 동작하고, 무거운
  라이브러리(`src/lib/webllm.ts`)는 `/요약`을 실제로 쓰는 순간에만 동적으로
  불러와서(코드 스플리팅) 이 기능을 안 쓰는 사용자의 번들 크기에는 영향이
  없습니다.
- WebGPU를 지원하지 않는 브라우저는 안내 문구를 보여주고 기존 서버 경로(CPU
  추출 요약 또는 지정 PC의 로컬 어댑터)로 그대로 넘어갑니다 — 새로 생긴 대체
  동작이 아니라 원래도 서버로 가던 경로입니다.

> **알려진 한계**: `isWebGpuSupported()`는 `navigator.gpu` 존재 여부만 확인합니다
> — API 자체는 있지만 실제 GPU 어댑터를 못 구하는 환경(헤드리스, 오래된 GPU
> 등)은 이 사전 확인을 통과하고 실제 추론 단계에서 실패해, "미지원 안내" 대신
> 일반 실패 메시지로 보일 수 있습니다.

### 대시보드 · 히스토리 · 채팅 상세

- **대시보드**(`/dashboard`) — 최근 활동 N건을 요약해 보여주는 진입 화면.
- **히스토리**(`/history`) — 전체 작업 이력을 taskType별(`/날씨`, `/요약`, `/파일`, `/상태`, `/코드`, `/사용량`) 배지로 필터링.
- **채팅 상세**(`/chat/:id`) — 개별 요청·응답 상세, 공유 메뉴.

### 사이드바 & 설정

- 접기/펼치기 가능한 사이드바, 새 검색·히스토리·대시보드·즐겨찾기·파일 내비게이션, 최근 검색 목록(슬래시 명령어는 파란 배지로 구분 표시).
- 프로필 클릭 → 드롭다운 메뉴(설정/언어/도움말/요금제/자세히 알아보기 서브메뉴 → 단축키 다이얼로그 등).
- 설정은 별도 페이지가 아니라 모달 다이얼로그이며, 테마(시스템/라이트/다크) 전환과 지정 PC 관리가 여기서 이루어집니다.

## 디자인 시스템

`DESIGN.md`가 이 프로젝트의 브랜드/UI 스펙 원본입니다 (컬러, 타이포, 컴포넌트, 카피 톤 등). UI 작업 전에 꼭 참고해주세요. 취향/교정 기록은 `.omd/preferences.md`에 쌓입니다.

## 프로젝트 구조

```
src/
  components/   # SearchBar, Sidebar, AppShell, SettingsDialog, ModelPickerPanel, 각종 Dialog/Popover
  features/     # 라우트 단위 화면 — auth(로그인/콜백), chat(채팅 상세), dashboard, history, not-found
  pages/        # features/의 각 화면을 라우터에 연결하는 진입점 + HomePage
  hooks/        # authContext, agentStatusContext, appearanceContext, currentUserContext, useTheme, useFontSize
  lib/          # commandTree, tasks, devices, pairing, webllm(Summary), oidc, apiClient, exampleCommands
  types/        # Web Speech API 등 타입 보강
```

## 관련 저장소

| 저장소 | 역할 |
|---|---|
| **slash-web** (현재) | 웹 클라이언트 — React·Vite UI, S3/CloudFront 배포 |
| [slash-api](https://github.com/LikeLionTeam4/slash-api) | 코어 API — 인증, 작업 관리, 실행 위치 결정, DB 연동 |
| [slash-nlu](https://github.com/LikeLionTeam4/slash-nlu) | 자연어 분석 — slash 명령 파싱, 규칙·Kiwi 의도 분류, 인자 추출 |
| [slash-llm](https://github.com/LikeLionTeam4/slash-llm) | LLM 서비스 — Gemma 추론 코드 보존(휴면, 2026-08-25~). 현재 서버 측 요약은 `slash-api`가 `SUMMARY_ENGINE=EXTRACTIVE`로 `slash-nlu`를 거쳐 처리 |
| [slash-runner](https://github.com/LikeLionTeam4/slash-runner) | PC 작업 실행기 — 위 "지정 PC 페어링"으로 연결되는 로컬 에이전트, PC 파일 검색·상태 조회 |
| [slash-infra](https://github.com/LikeLionTeam4/slash-infra) | 인프라 — Terraform(AWS), Helm·ArgoCD 배포 |
| [slash-docs](https://github.com/LikeLionTeam4/slash-docs) | 프로젝트 문서 — 아키텍처, API 계약, ERD, 회의록 |
