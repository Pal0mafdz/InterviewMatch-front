import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { ReactNode } from 'react'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, token, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F0E4CC', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.65rem', color: '#C9521A' }}>CARGANDO...</div>
    </div>
  )
  if (!token) return <Navigate to="/login" replace />
  if (user?.rol !== 'admin') return <Navigate to="/sessions" replace />
  return <>{children}</>
}
