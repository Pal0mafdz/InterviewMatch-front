import { useEffect, useMemo, useState } from 'react'
import { Button, Card } from 'pixel-retroui'
import { getUsers, type UserProfile } from '../../api/users'
import { AdminUserProfileModal } from '../../components/AdminUserProfileModal'

type AdminUserModalState = UserProfile | null

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function roleChip(rol: UserProfile['rol']) {
  if (rol === 'admin') {
    return <span className="retro-chip retro-chip-blue">ADMIN</span>
  }

  return <span className="retro-chip retro-chip-green">USER</span>
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserModalState>(null)

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }, [])

  const filteredUsers = useMemo(() => {
    const query = normalizeText(search)

    if (!query) {
      return users
    }

    return users.filter((user) => {
      const searchable = [
        user.nombre || '',
        user.email || '',
        user._id || '',
        user.rol || '',
      ].join(' ').toLowerCase()

      return searchable.includes(query)
    })
  }, [users, search])

  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((user) => user.rol === 'admin').length
    const activeUsers = users.filter((user) => user.rol === 'user').length
    const blocked = users.filter((user) => user.isBlocked).length
    const withCv = users.filter((user) => Boolean(user.cvPath)).length

    return { total, admins, activeUsers, blocked, withCv }
  }, [users])

  return (
    <div>
      <AdminUserProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 6 }}>
          👥 USUARIOS REGISTRADOS
        </h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>
          Vista administrativa global de usuarios del sistema
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'TOTAL', value: stats.total },
          { label: 'USERS', value: stats.activeUsers },
          { label: 'ADMINS', value: stats.admins },
          { label: 'BLOQUEADOS', value: stats.blocked },
          { label: 'CON CV', value: stats.withCv },
        ].map((stat) => (
          <div key={stat.label} className="retro-stat">
            <div className="retro-stat-value">{stat.value}</div>
            <div className="retro-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
      ) : error ? (
        <div className="retro-alert retro-alert-error">{error}</div>
      ) : (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header"><h2>LISTADO DE USUARIOS ({filteredUsers.length})</h2></div>
          <div style={{ padding: 20, overflowX: 'auto' }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Buscar por nombre, correo, id o rol"
              style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace", marginBottom: 16 }}
            />

            <table className="retro-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>NOMBRE</th>
                  <th style={{ textAlign: 'left' }}>EMAIL</th>
                  <th style={{ textAlign: 'center' }}>ROL</th>
                  <th style={{ textAlign: 'center' }}>ESTADO</th>
                  <th style={{ textAlign: 'center' }}>CV</th>
                  <th style={{ textAlign: 'center' }}>PERFIL</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 18, color: '#7A4F2D', fontFamily: "'Space Mono', monospace" }}>
                      No hay usuarios para este filtro
                    </td>
                  </tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td style={{ fontWeight: 700 }}>{user.nombre || 'Sin nombre'}</td>
                    <td style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.74rem' }}>{user.email}</td>
                    <td style={{ textAlign: 'center' }}>{roleChip(user.rol)}</td>
                    <td style={{ textAlign: 'center' }}>
                      {user.isBlocked
                        ? <span className="retro-chip retro-chip-red">BLOQUEADO</span>
                        : <span className="retro-chip retro-chip-green">ACTIVO</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {user.cvPath
                        ? <span className="retro-chip retro-chip-blue">SI</span>
                        : <span className="retro-chip retro-chip-muted">NO</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        bg="#FBF3E3"
                        textColor="#1A0F08"
                        shadow="#1A0F08"
                        borderColor="#1A0F08"
                        onClick={() => setSelectedUser(user)}
                      >
                        VER PERFIL
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
