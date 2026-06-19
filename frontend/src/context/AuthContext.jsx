import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('cms_token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('cms_user')
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  })

  const navigate = useNavigate()

  const login = useCallback(async (email, password) => {
    const { data } = await apiLogin(email, password)
    const { access_token, user: userData } = data
    localStorage.setItem('cms_token', access_token)
    localStorage.setItem('cms_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
    navigate('/')
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem('cms_token')
    localStorage.removeItem('cms_user')
    setToken(null)
    setUser(null)
    navigate('/login')
  }, [navigate])

  const isAdmin    = user?.role === 'admin'
  const isStaff    = user?.role === 'staff'
  const isCustomer = user?.role === 'customer'

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAdmin, isStaff, isCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
