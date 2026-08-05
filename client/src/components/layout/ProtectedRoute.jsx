import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/authContext.js'
import { homeFor } from '../../lib/roles.js'

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />
  }

  return <Outlet />
}
