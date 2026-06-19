import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('edutrack_user')
    return stored ? JSON.parse(stored) : null
  })

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('edutrack_token', access_token)
    localStorage.setItem('edutrack_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  function logout() {
    localStorage.removeItem('edutrack_token')
    localStorage.removeItem('edutrack_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
