import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/login'
import { DashboardPage } from './pages/dashboard'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
