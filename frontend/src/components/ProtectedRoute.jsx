import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdminUser } from '../lib/authUtils.js'

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

  const isAdmin = isAdminUser(user)

  if (allowedRoles) {
    const hasRole = allowedRoles.some((role) => {
      if (role === 'ADMIN' || role === 'ROLE_ADMIN' || role === 'ROLE_SYSTEM_ADMIN') {
        return isAdmin
      }
      const userRole = user?.role
      const userRoles = user?.roles || []
      return userRole === role || userRoles.includes(role)
    })

    if (!hasRole) {
      return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
    }
  } else {
    if (isAdmin && (location.pathname === '/dashboard' || location.pathname === '/')) {
      return <Navigate to="/admin/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute
