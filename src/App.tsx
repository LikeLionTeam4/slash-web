import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { ChatDetailPage } from './pages/ChatDetailPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { RequireAuth } from './features/auth/RequireAuth'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/new" replace />} />
      <Route path="/login" element={<LoginPage />} />

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
    </Routes>
  )
}

export default App
