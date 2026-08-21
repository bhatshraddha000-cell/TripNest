export function isAdminUser(user) {
  if (!user) return false

  const userRole = user.role
  const userRoles = Array.isArray(user.roles) ? user.roles : []

  return (
    userRole === 'ADMIN' ||
    userRole === 'ROLE_ADMIN' ||
    userRole === 'ROLE_SYSTEM_ADMIN' ||
    userRoles.includes('ADMIN') ||
    userRoles.includes('ROLE_ADMIN') ||
    userRoles.includes('ROLE_SYSTEM_ADMIN')
  )
}
