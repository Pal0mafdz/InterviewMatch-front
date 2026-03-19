import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import type { ReactNode } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { NiniLogo } from './NiniLogo'

const SIDEBAR_BG = '#1A0F08'
const SIDEBAR_ACTIVE = '#C9521A'
const SIDEBAR_TEXT = '#A0836A'

interface NavItem {
  icon: string  // emoji icon
  label: string
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: '📅', label: 'SESIONES', to: '/sessions' },
  { icon: '🗂️', label: 'MOCKS', to: '/my-mocks' },
  { icon: '💬', label: 'CHAT', to: '/chats' },
  { icon: '🧰', label: 'ARSENAL', to: '/arsenal' },
  { icon: '👤', label: 'PERFIL', to: '/profile' },
]

const ADMIN_ITEMS: NavItem[] = [
  { icon: '⚙️', label: 'ADMIN', to: '/admin/sessions' },
  { icon: '👥', label: 'USERS', to: '/admin/users' },
  { icon: '➕', label: 'NUEVA', to: '/admin/sessions/new' },
]

interface AppLayoutProps {
  children: ReactNode
  title: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useDocumentTitle(title)

  const isAdmin = user?.rol === 'admin'
  const allNavItems = [...NAV_ITEMS]
  const adminItems = isAdmin ? ADMIN_ITEMS : []

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F0E4CC' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 88,
        minWidth: 88,
        backgroundColor: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 16,
        borderRight: '3px solid #C9521A',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate('/sessions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
            cursor: 'pointer',
          }}
        >
          <NiniLogo
            size={44}
            shadowOffset={3}
            borderWidth={3}
            inset={6}
            className="nini-logo--sidebar"
          />
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {[...allNavItems, ...adminItems].map((item, i) => {
            const active = isActive(item.to)
            const showAdminDivider = adminItems.length > 0 && i === allNavItems.length
            return (
              <div key={item.to}>
                {showAdminDivider && (
                  <div style={{ padding: '6px 12px', marginTop: 4, marginBottom: 2 }}>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />
                  </div>
                )}
                <div
                  onClick={() => navigate(item.to)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: 14,
                    paddingBottom: 14,
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: active ? 'rgba(201,82,26,0.2)' : 'transparent',
                    borderRight: active ? `3px solid ${SIDEBAR_ACTIVE}` : '3px solid transparent',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
                >
                  <span style={{ fontSize: '1.3rem', marginBottom: 5 }}>{item.icon}</span>
                  <span style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: '0.38rem',
                    color: active ? SIDEBAR_ACTIVE : SIDEBAR_TEXT,
                    letterSpacing: '0.05em',
                    textAlign: 'center',
                  }}>
                    {item.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Logout */}
        <div
          onClick={logout}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 12,
            paddingBottom: 8,
            cursor: 'pointer',
            color: SIDEBAR_TEXT,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = '#FFF' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = SIDEBAR_TEXT }}
        >
          <span style={{ fontSize: '1.1rem', marginBottom: 5 }}>🚪</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.38rem', letterSpacing: '0.05em' }}>
            SALIR
          </span>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Amber header */}
        <div style={{
          backgroundColor: '#F5C842',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #1A0F08',
          boxShadow: '0 3px 0 #1A0F08',
          flexShrink: 0,
        }}>
          <h1 style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '0.75rem',
            color: '#1A0F08',
            lineHeight: 1.4,
            letterSpacing: '0.03em',
          }}>
            {title}
          </h1>

          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#FBF3E3',
              border: '2px solid #1A0F08',
              boxShadow: '2px 2px 0 #1A0F08',
              padding: '6px 12px',
            }}>
              <div className="retro-avatar retro-avatar-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#1A0F08', lineHeight: 1.5 }}>
                  {user.nombre}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#7A4F2D', textTransform: 'uppercase' }}>
                  {user.rol}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
