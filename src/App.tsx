import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { ChatDetailPage } from './pages/ChatDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { EchoTestPage } from './pages/EchoTestPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { RequireGuest } from './features/auth/RequireGuest'
import { AppearanceProvider } from './hooks/appearanceContext'

function App() {
  return (
    <AppearanceProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/new" replace />} />
        {/* 이미 로그인했으면 볼 이유가 없는 화면 — 앱으로 돌려보낸다. */}
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* 로그인해야 열리는 화면들 — 새 라우트는 이 블록 안에 넣으면 자동으로 보호된다. */}
        <Route element={<RequireAuth />}>
          <Route
            path="/new"
            element={
              <AppShell>
                <HomePage />
              </AppShell>
            }
          />
          <Route
            path="/chat/:id"
            element={
              <AppShell>
                <ChatDetailPage />
              </AppShell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AppShell>
                <DashboardPage />
              </AppShell>
            }
          />
          <Route
            path="/history"
            element={
              <AppShell>
                <HistoryPage />
              </AppShell>
            }
          />
        </Route>

        {/* slash-web-test 전용 — 로그인 없이 mock-api·로컬 에이전트 종단 통신을 확인한다. */}
        <Route path="/dev/echo-test" element={<EchoTestPage />} />

        {/* 정의된 라우트가 하나도 안 맞을 때 — 로그인 여부와 무관하게 항상 뜬다. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppearanceProvider>
  )
}

export default App
