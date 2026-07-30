import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'
import { ChatDetailPage } from './pages/ChatDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/new" replace />} />
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
    </Routes>
  )
}

export default App
