import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdminUser } from '../lib/authUtils.js'
import { dashboardApi } from '../lib/dashboardApi.js'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'
import WelcomeCard from '../components/dashboard/WelcomeCard.jsx'
import StatsCards from '../components/dashboard/StatsCards.jsx'
import UpcomingTrips from '../components/dashboard/UpcomingTrips.jsx'
import BudgetSummary from '../components/dashboard/BudgetSummary.jsx'
import RecentActivities from '../components/dashboard/RecentActivities.jsx'
import Notifications from '../components/dashboard/Notifications.jsx'
import QuickActions from '../components/dashboard/QuickActions.jsx'
import TravelInspiration from '../components/dashboard/TravelInspiration.jsx'

function formatCurrency(value) {
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '₹0'
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`
  }
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  }
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) {
    return 'Yesterday'
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getNotificationIcon(type) {
  switch (type) {
    case 'EXPENSE_ADDED':
    case 'EXPENSE_UPDATED':
    case 'EXPENSE_DELETED':
      return '🛍'
    case 'TRIP_INVITATION':
    case 'TRIP_CREATED':
    case 'GROUP_MEMBER_JOINED':
      return '✉'
    case 'ITINERARY_CREATED':
    case 'ITINERARY_UPDATED':
      return '🗓'
    case 'ACTIVITY_CREATED':
      return '📌'
    default:
      return '💡'
  }
}

function DashboardPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || isAdminUser(user)) return
    let isMounted = true

    async function fetchDashboard() {
      try {
        setLoading(true)
        setError(null)
        const data = await dashboardApi.getDashboardData()
        if (isMounted) {
          setDashboardData(data)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load dashboard data:', err)
          setError('Unable to load latest dashboard data.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user])

  if (!authLoading && isAuthenticated && isAdminUser(user)) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'
  const today = new Date().toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const totalTripsValue = dashboardData?.totalTrips ?? 0
  const upcomingTripsValue = dashboardData?.upcomingTripsCount ?? 0
  const totalBudgetValue = dashboardData?.totalBudget ?? 0
  const totalExpensesValue = dashboardData?.totalExpenses ?? 0

  const stats = [
    { label: 'Total Trips', value: loading ? '...' : String(totalTripsValue), icon: '🧳' },
    { label: 'Upcoming Trips', value: loading ? '...' : String(upcomingTripsValue), icon: '🗓' },
    { label: 'Total Budget (All Trips)', value: loading ? '...' : formatCurrency(totalBudgetValue), icon: '💰' },
    { label: 'Total Expenses (All Trips)', value: loading ? '...' : formatCurrency(totalExpensesValue), icon: '🛍' },
  ]

  const upcomingTrips = (Array.isArray(dashboardData?.upcomingTrips) ? dashboardData.upcomingTrips : []).map((trip) => ({
    id: trip.id,
    destination: trip.destination || trip.title || 'Trip',
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status || 'Planning',
    imageLabel: '🏝',
  }))

  const activities = (Array.isArray(dashboardData?.recentActivities) ? dashboardData.recentActivities : []).map((act) => ({
    id: act.id,
    title: act.title || 'Activity',
    description: act.description || '',
    time: formatRelativeTime(act.createdAt),
  }))

  const notifications = (Array.isArray(dashboardData?.notifications) ? dashboardData.notifications : []).map((n) => ({
    id: n.id,
    icon: getNotificationIcon(n.type),
    title: n.title || 'Notification',
    message: n.message || '',
    time: formatRelativeTime(n.createdAt),
  }))

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main">
            <WelcomeCard
              name={displayName}
              date={today}
              quote="The journey of a thousand miles begins with a single trip plan."
            />

            {error && (
              <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                {error}
              </div>
            )}

            <StatsCards stats={stats} />

            <div className="dashboard-grid-section">
              <UpcomingTrips trips={upcomingTrips} />
              <BudgetSummary
                mode={dashboardData?.budgetSummary?.mode}
                destination={dashboardData?.budgetSummary?.destination}
                totalBudget={dashboardData?.budgetSummary?.totalBudget ?? dashboardData?.totalBudget ?? 0}
                spent={dashboardData?.budgetSummary?.spent ?? dashboardData?.totalExpenses ?? 0}
                remaining={dashboardData?.budgetSummary?.remaining ?? dashboardData?.remainingBudget ?? 0}
                progress={dashboardData?.budgetSummary?.spentPercentage ?? dashboardData?.budgetPercentage ?? 0}
                loading={loading}
              />
            </div>

            <div className="dashboard-grid-section secondary-grid">
              <RecentActivities activities={activities} />
              <Notifications items={notifications} />
            </div>

            <div className="dashboard-grid-section secondary-grid">
              <QuickActions />
              <TravelInspiration />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
