import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { AdminRoute } from '../components/AdminRoute'
import { AppLayout } from '../components/AppLayout'
import { Login } from '../pages/auth/Login'
import { Register } from '../pages/auth/Register'
import { Sessions } from '../pages/user/Sessions'
import { SessionDetail } from '../pages/user/SessionDetail'
import { Profile } from '../pages/user/Profile'
import { MyMatch } from '../pages/user/MyMatch'
import { MyMocks } from '../pages/user/MyMocks'
import { ChatHub } from '../pages/user/ChatHub'
import { Arsenal } from '../pages/user/Arsenal'
import { AdminSessions } from '../pages/admin/AdminSessions'
import { CreateSession } from '../pages/admin/CreateSession'
import { AdminSessionDetail } from '../pages/admin/AdminSessionDetail'
import { AdminUsers } from '../pages/admin/AdminUsers'
import { FeedbackStudioPage } from '../pages/feedback/FeedbackStudioPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/feedback" element={<FeedbackStudioPage />} />
        <Route path="/feedback/:id" element={<FeedbackStudioPage />} />
        <Route path="/feedback/view/:id" element={<FeedbackStudioPage />} />

        {/* User routes */}
        <Route path="/sessions" element={
          <ProtectedRoute>
            <AppLayout title="Sesiones de Mock Interview">
              <Sessions />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/sessions/:id" element={
          <ProtectedRoute>
            <AppLayout title="Detalle de Sesión">
              <SessionDetail />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/sessions/:id/match" element={
          <ProtectedRoute>
            <AppLayout title="Mi Pareja">
              <MyMatch />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout title="Mi Perfil">
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/my-mocks" element={
          <ProtectedRoute>
            <AppLayout title="Mis Mocks">
              <MyMocks />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/chats" element={
          <ProtectedRoute>
            <AppLayout title="Chat de Parejas">
              <ChatHub />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/arsenal" element={
          <ProtectedRoute>
            <AppLayout title="Arsenal Retro">
              <Arsenal />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/sessions" element={
          <AdminRoute>
            <AppLayout title="Admin — Sesiones">
              <AdminSessions />
            </AppLayout>
          </AdminRoute>
        } />
        <Route path="/admin/sessions/new" element={
          <AdminRoute>
            <AppLayout title="Admin — Nueva Sesión">
              <CreateSession />
            </AppLayout>
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AppLayout title="Admin — Usuarios">
              <AdminUsers />
            </AppLayout>
          </AdminRoute>
        } />
        <Route path="/admin/sessions/:id" element={
          <AdminRoute>
            <AppLayout title="Admin — Detalle de Sesión">
              <AdminSessionDetail />
            </AppLayout>
          </AdminRoute>
        } />

        <Route path="/" element={<Navigate to="/sessions" replace />} />
        <Route path="*" element={<Navigate to="/sessions" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
