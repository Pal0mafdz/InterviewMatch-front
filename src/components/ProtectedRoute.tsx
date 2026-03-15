import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { type ReactNode } from 'react'
import { LoadingWindow } from './LoadingWindow'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) return <LoadingWindow />
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
