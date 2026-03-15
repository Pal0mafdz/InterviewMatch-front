import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return null

  const isAdmin = user.rol === 'admin'

  const tabs = [
    { to: '/sessions', label: 'Sesiones' },
    { to: '/profile', label: 'Mi Perfil' },
    ...(isAdmin ? [
      { to: '/admin/sessions', label: 'Admin: Sesiones' },
      { to: '/admin/sessions/new', label: 'Admin: Nueva' },
    ] : []),
  ]

  return (
    <div
      className="window"
      style={{ width: 800, margin: '0 auto 0', position: 'sticky', top: 20 }}
    >
      <div className="title-bar">
        <div className="title-bar-text">🖥 InterviewMatch</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close" onClick={logout}></button>
        </div>
      </div>
      <div className="window-body" style={{ padding: '4px 0' }}>
        <menu role="tablist" style={{ margin: 0 }}>
          {tabs.map(tab => (
            <li
              key={tab.to}
              role="tab"
              aria-selected={location.pathname === tab.to || location.pathname.startsWith(tab.to + '/')}
            >
              <Link to={tab.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                {tab.label}
              </Link>
            </li>
          ))}
        </menu>
      </div>
    </div>
  )
}
