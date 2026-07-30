import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { HomePage } from './pages/HomePage'

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
    </Routes>
  )
}

export default App
