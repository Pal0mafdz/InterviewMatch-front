import { createContext, useEffect, useState, type ReactNode } from 'react'
import { getProfile, type UserProfile } from '../api/users'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  login: (user: UserProfile, token: string) => void
  logout: () => void
  loading: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState<boolean>(() => localStorage.getItem('token') !== null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      getProfile()
        .then((profile) => setUser(profile))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    }
  }, [])

  function login(userData: UserProfile, userToken: string) {
    localStorage.setItem('token', userToken)
    setToken(userToken)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

