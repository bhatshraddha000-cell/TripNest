import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, authLoading, user } = useAuth()
  const location = useLocation()

  if (authLoading) {
    return (
      <div className="app-shell page-center">
        <div className="auth-card">
          <h2>Checking your session</h2>
          <p>Please wait while we restore your TripNest account.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles) {
    const userRole = user?.role
    const userRoles = user?.roles || []
    const hasRole = allowedRoles.some(
      (role) => userRole === role || userRoles.includes(role)
    )
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute
