import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AdminRoute } from '../components/AdminRoute'
import { Navbar } from '../components/Navbar'
import { StatusBar } from '../components/StatusBar'
import { Login } from '../pages/auth/Login'
import { Register } from '../pages/auth/Register'
import { Sessions } from '../pages/user/Sessions'
import { SessionDetail } from '../pages/user/SessionDetail'
import { Profile } from '../pages/user/Profile'
import { MyMatch } from '../pages/user/MyMatch'
import { AdminSessions } from '../pages/admin/AdminSessions'
import { CreateSession } from '../pages/admin/CreateSession'
import { AdminSessionDetail } from '../pages/admin/AdminSessionDetail'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ paddingBottom: 40 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
          <Route path="/sessions/:id/match" element={<ProtectedRoute><MyMatch /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin/sessions" element={<AdminRoute><AdminSessions /></AdminRoute>} />
          <Route path="/admin/sessions/new" element={<AdminRoute><CreateSession /></AdminRoute>} />
          <Route path="/admin/sessions/:id" element={<AdminRoute><AdminSessionDetail /></AdminRoute>} />
          <Route path="/" element={<Navigate to="/sessions" replace />} />
          <Route path="*" element={<Navigate to="/sessions" replace />} />
        </Routes>
      </main>
      <StatusBar />
    </BrowserRouter>
  )
}
