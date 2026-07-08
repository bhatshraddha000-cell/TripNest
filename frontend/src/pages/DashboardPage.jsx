import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
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
  return `₹${value.toLocaleString('en-IN')}`
}

const stats = [
  { label: 'Total Trips', value: '12', icon: '🧳' },
  { label: 'Upcoming Trips', value: '3', icon: '🗓' },
  { label: 'Total Budget', value: formatCurrency(75000), icon: '💰' },
  { label: 'Total Expenses', value: formatCurrency(18450), icon: '🛍' },
]

const upcomingTrips = [
  { destination: 'Santorini', date: 'Aug 18, 2026', status: 'Confirmed', imageLabel: '🏝' },
  { destination: 'Kyoto', date: 'Sep 03, 2026', status: 'Planning', imageLabel: '🌸' },
  { destination: 'Marrakech', date: 'Oct 12, 2026', status: 'Booked', imageLabel: '🌆' },
]

const activities = [
  { id: 1, title: 'Trip created', description: 'A new adventure to Santorini was added to your plan.', time: '10 min ago' },
  { id: 2, title: 'Expense added', description: 'Hotel booking for Kyoto was recorded.', time: '1 hour ago' },
  { id: 3, title: 'Itinerary updated', description: 'You added a guide to the local food tour.', time: '3 hours ago' },
  { id: 4, title: 'Group member joined', description: 'Mina joined your Morocco group trip.', time: 'Yesterday' },
]

const notifications = [
  { id: 1, icon: '✉', title: 'New itinerary shared', message: 'Your group shared a new plan for Kyoto.' },
  { id: 2, icon: '🏷', title: 'Flight reminder', message: 'Check-in opens in 2 days for Santorini.' },
  { id: 3, icon: '💡', title: 'Budget tip', message: 'You are 18% under your trip budget.' },
]

function DashboardPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()

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

            <StatsCards stats={stats} />

            <div className="dashboard-grid-section">
              <UpcomingTrips trips={upcomingTrips} />
              <BudgetSummary totalBudget="75000" spent="18450" remaining="56550" progress={75} />
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
