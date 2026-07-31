import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (superAdminOnly && user.role !== 'superadmin') return <Navigate to="/admin" replace />
  if (adminOnly && !['admin', 'superadmin'].includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}
