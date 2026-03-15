import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { type ReactNode } from 'react'
import { LoadingWindow } from './LoadingWindow'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth()

  if (loading) return <LoadingWindow />
  if (!token) return <Navigate to="/login" replace />
  if (user?.rol !== 'admin') return <Navigate to="/sessions" replace />
  return <>{children}</>
}
