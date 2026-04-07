import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

interface Props {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { session, profile, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader-ring" />
        <p>Đang tải...</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/" replace />

  return <>{children}</>
}
