import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { authApi } from '../api/client'
import type { Usuario } from '../types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

interface AuthContextType {
  user: Usuario | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const saveAuth = useCallback((token: string, u: Usuario) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    const cached = localStorage.getItem(USER_KEY)
    if (token && cached) {
      try {
        setUser(JSON.parse(cached))
      } catch {
        localStorage.removeItem(USER_KEY)
      }
      authApi.me().then((u) => {
        setUser(u)
        localStorage.setItem(USER_KEY, JSON.stringify(u))
      }).catch(() => {
        signOut()
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [signOut])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    saveAuth(res.access_token, res.user)
  }, [saveAuth])

  const register = useCallback(async (email: string, password: string, nombre: string) => {
    const res = await authApi.register({ email, password, nombre })
    saveAuth(res.access_token, res.user)
  }, [saveAuth])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
