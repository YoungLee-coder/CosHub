import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/login'
import { DashboardPage } from './pages/dashboard'
import { SetupPage } from './pages/setup'

export function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
