import { useState, useEffect } from 'react'
import { Navigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdminUser } from '../lib/authUtils.js'
import { analyticsApi } from '../lib/analyticsApi.js'
import { tripApi } from '../lib/tripApi.js'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'

function formatCurrency(value) {
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '₹0'
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

const CATEGORY_COLOR_MAP = {
  food: '#ea580c',
  dining: '#ea580c',
  shopping: '#2563eb',
  accommodation: '#9333ea',
  hotel: '#9333ea',
  lodging: '#9333ea',
  transportation: '#16a34a',
  transit: '#16a34a',
  travel: '#16a34a',
  flight: '#16a34a',
  sightseeing: '#db2777',
  adventure: '#db2777',
  activities: '#db2777',
  entertainment: '#ca8a04',
  other: '#0d9488',
}

const CATEGORY_COLORS = [
  '#2563eb', // blue
  '#ea580c', // orange
  '#16a34a', // green
  '#db2777', // pink
  '#9333ea', // purple
  '#ca8a04', // yellow
  '#0d9488', // teal
  '#4f46e5', // indigo
]

function getCategoryColor(category, index = 0) {
  if (!category) return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  const key = String(category).trim().toLowerCase()
  if (CATEGORY_COLOR_MAP[key]) {
    return CATEGORY_COLOR_MAP[key]
  }
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length]
}

function SvgDoughnutChart({ data, title }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📊</span>
        <p style={{ margin: 0 }}>No expenses recorded for this trip yet.</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0)
  const radius = 35
  const circumference = 2 * Math.PI * radius

  if (total === 0) {
    return (
      <div className="chart-empty-state" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📊</span>
        <p style={{ margin: 0 }}>No expenses recorded for this trip yet.</p>
      </div>
    )
  }

  let accumulatedPercent = 0

  return (
    <div className="custom-chart-container">
      <div className="svg-wrapper">
        <svg viewBox="0 0 100 100" width="200" height="200">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border-color, #e2e8f0)" strokeWidth="12" />
          {data.map((item, idx) => {
            const percent = (item.value || 0) / total
            const strokeLength = percent * circumference
            const gapLength = Math.max(circumference - strokeLength, 0)
            const strokeOffset = circumference - (accumulatedPercent * circumference)
            accumulatedPercent += percent

            const isHovered = hoveredIdx === idx

            return (
              <circle
                key={item.label}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? 15 : 12}
                strokeDasharray={`${strokeLength} ${gapLength}`}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 50 50)"
                style={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            )
          })}
          {/* Centered Summary Text */}
          <text x="50" y="47" textAnchor="middle" fontSize="6" fontWeight="bold" fill="var(--text-secondary, #64748b)">
            TOTAL
          </text>
          <text x="50" y="56" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--text-primary, #1e293b)">
            {total > 100000 ? `₹${Math.round(total / 1000)}k` : `₹${Math.round(total)}`}
          </text>
        </svg>
      </div>

      <div className="chart-legend">
        {data.map((item, idx) => {
          const percent = ((item.value / total) * 100).toFixed(1)
          const isHovered = hoveredIdx === idx

          return (
            <div
              key={item.label}
              className={`legend-item ${isHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isHovered ? 'rgba(0,0,0,0.04)' : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1, color: 'var(--text-primary, #1e293b)' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary, #64748b)' }}>
                {formatCurrency(item.value)} ({percent}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SvgBarChart({ data, maxValue }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <span style={{ fontSize: '2rem' }}>📊</span>
        <p>No statistics available.</p>
      </div>
    )
  }

  const maxVal = maxValue || Math.max(...data.map((d) => d.value || 0), 1)

  return (
    <div className="svg-bar-chart-container" style={{ width: '100%', padding: '16px 8px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((item, idx) => {
          const percentage = Math.min((item.value / maxVal) * 100, 100)
          const isHovered = hoveredIdx === idx

          return (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>{item.label}</span>
                <span style={{ color: item.color || '#3b82f6' }}>{item.displayValue || formatCurrency(item.value)}</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '14px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: 'pointer',
                  border: isHovered ? '1px solid #94a3b8' : '1px solid transparent',
                  transition: 'border 0.2s',
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: item.color || '#3b82f6',
                    borderRadius: '6px',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnalyticsPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [trips, setTrips] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedTripId = searchParams.get('tripId') || 'all'

  useEffect(() => {
    if (!isAuthenticated) return
    let isMounted = true

    async function fetchTrips() {
      try {
        const userTrips = await tripApi.getAllTrips()
        if (isMounted) {
          setTrips(userTrips.filter((t) => t.status !== 'CANCELLED'))
        }
      } catch (err) {
        console.error('Failed to fetch trips for analytics dropdown:', err)
      }
    }

    fetchTrips()
    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    let isMounted = true

    async function fetchAnalytics() {
      try {
        setLoading(true)
        setError(null)
        const response = await analyticsApi.getTravelerAnalytics(selectedTripId)
        if (isMounted) {
          setData(response)
        }
      } catch (err) {
        if (isMounted) {
          console.error(err)
          setError('Failed to fetch analytics data. Make sure you have authorized access.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAnalytics()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, selectedTripId])

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const isAdmin = isAdminUser(user)

  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  const displayName = user?.fullName ?? 'Traveler'
  const displayEmail = user?.email ?? 'traveler@tripnest.com'

  // Map DTO maps to charts data
  const expenseByCategoryData = data?.expenseByCategory
    ? Object.keys(data.expenseByCategory).map((key, i) => ({
        label: key,
        value: data.expenseByCategory[key],
        color: getCategoryColor(key, i),
      }))
    : []

  const tripsByStatusData = data?.tripsByStatus
    ? Object.keys(data.tripsByStatus).map((key) => ({
        label: key,
        value: data.tripsByStatus[key],
        color: key === 'UPCOMING' ? '#3b82f6' : key === 'ONGOING' ? '#10b981' : '#f59e0b',
        displayValue: `${data.tripsByStatus[key]} trips`,
      }))
    : []

  const spendingByTripData = data?.spendingByTrip
    ? Object.keys(data.spendingByTrip).map((key, i) => ({
        label: key,
        value: data.spendingByTrip[key],
        color: CATEGORY_COLORS[(i + 2) % CATEGORY_COLORS.length],
      }))
    : []

  const favDestinationsData = data?.favoriteDestinations
    ? data.favoriteDestinations.map((d, i) => ({
        label: d.destination,
        value: d.tripCount,
        displayValue: `${d.tripCount} trip${d.tripCount > 1 ? 's' : ''}`,
        color: CATEGORY_COLORS[(i + 4) % CATEGORY_COLORS.length],
      }))
    : []

  // Budget comparison: Budget vs Spending vs Remaining
  const budgetVsActualData = data
    ? [
        { label: 'Total Budget', value: data.totalBudget, color: '#4f46e5' },
        { label: 'Estimated Costs', value: data.totalEstimatedCost, color: '#0d9488' },
        { label: 'Actual Spending', value: data.totalSpent, color: '#ef4444' },
        { label: 'Remaining Budget', value: Math.max(data.remainingBudget, 0), color: '#10b981' },
      ]
    : []

  const selectedTrip = trips.find((t) => String(t.id) === String(selectedTripId))

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={displayName} userEmail={displayEmail} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>
                  {selectedTripId === 'all' ? 'Travel Analytics' : `${selectedTrip?.title ?? 'Trip'} Trip Analytics`}
                </h1>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {selectedTripId === 'all'
                    ? 'Analyze your trips, expenses, destination choices, and budget metrics.'
                    : `Analytics for your trip to ${selectedTrip?.destination ?? 'your destination'}.`}
                </p>
              </div>

              <div style={{ position: 'relative', minWidth: '220px' }}>
                <select
                  id="trip-selector"
                  value={selectedTripId}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'all') {
                      setSearchParams({})
                    } else {
                      setSearchParams({ tripId: val })
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    appearance: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '16px',
                    paddingRight: '40px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  <option value="all">All Trips</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : data?.totalTrips === 0 && selectedTripId === 'all' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', padding: '40px', textAlign: 'center' }} className="dashboard-card">
                <span style={{ fontSize: '3.5rem', marginBottom: '16px', display: 'block' }}>✈️</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0', color: '#1e293b' }}>No trips available yet.</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '0 0 24px 0', maxWidth: '350px' }}>
                  Create a trip first to start tracking your travel analytics and expenses.
                </p>
                <Link to="/trips" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600, display: 'inline-block', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}>
                  Go to My Trips
                </Link>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Budget Limit</span>
                      <span style={{ fontSize: '1.25rem' }}>💰</span>
                    </div>
                    <strong style={{ fontSize: '1.6rem', color: '#1e293b' }}>{formatCurrency(data?.totalBudget)}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {data?.totalBudget === 0 ? (
                        <span style={{ color: '#ea580c', fontWeight: 500 }}>No budget set for this trip.</span>
                      ) : (
                        selectedTripId === 'all' ? `Across ${data?.totalTrips} planned trips` : 'Trip budget limit'
                      )}
                    </div>
                  </div>

                  <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Spent</span>
                      <span style={{ fontSize: '1.25rem' }}>💸</span>
                    </div>
                    <strong style={{ fontSize: '1.6rem', color: '#ef4444' }}>{formatCurrency(data?.totalSpent)}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Utilized {data?.budgetUtilization.toFixed(1)}% of budget
                    </div>
                  </div>

                  <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Remaining Balance</span>
                      <span style={{ fontSize: '1.25rem' }}>🛡️</span>
                    </div>
                    <strong style={{ fontSize: '1.6rem', color: data?.remainingBudget >= 0 ? '#10b981' : '#ef4444' }}>
                      {formatCurrency(data?.remainingBudget)}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {data?.remainingBudget >= 0 ? 'Within budget limit' : 'Over budget limit'}
                    </div>
                  </div>

                  <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Destinations & Activities</span>
                      <span style={{ fontSize: '1.25rem' }}>🏔️</span>
                    </div>
                    <strong style={{ fontSize: '1.6rem', color: '#4f46e5' }}>
                      {selectedTripId === 'all'
                        ? `${data?.totalDestinations} Visited`
                        : (selectedTrip?.destination || '1 Destination')}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {data?.totalActivities === 0 ? (
                        <span style={{ color: '#ea580c', fontWeight: 500 }}>No activities scheduled for this trip yet.</span>
                      ) : (
                        `Mapped ${data?.totalActivities} itinerary activities`
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Analytics Panels */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                  {/* Category Breakdown (Doughnut) */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Expense breakdown by Category</h2>
                    <SvgDoughnutChart data={expenseByCategoryData} title="Expense Categories" />
                  </div>

                  {/* Budget Overview (Bar) */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Budget vs Spending Summary</h2>
                    <SvgBarChart data={budgetVsActualData} maxValue={Math.max(data?.totalBudget || 1, data?.totalEstimatedCost || 1)} />
                  </div>

                  {/* Spending by Trip (Bar) */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Spending by Trip</h2>
                    <SvgBarChart data={spendingByTripData} />
                  </div>

                  {/* Favorite Destinations (Bar) */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Popular Destinations</h2>
                    <SvgBarChart data={favDestinationsData} />
                  </div>

                  {/* Trips status */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Trips status Distribution</h2>
                    <SvgBarChart data={tripsByStatusData} />
                  </div>

                  {/* Expense Splitting Details */}
                  <div className="dashboard-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Expense Split Settlements</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '8px 0' }}>
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount Owed</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                          {formatCurrency(data?.amountOwedByCurrentUser)}
                        </div>
                      </div>
                      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount to Receive</span>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                          {formatCurrency(data?.amountToReceive)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span>Total Paid in Expenses</span>
                        <strong>{formatCurrency(data?.amountPaidByCurrentUser)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                        <span>Settled split shares</span>
                        <strong style={{ color: '#10b981' }}>{formatCurrency(data?.settledAmount)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Pending split shares</span>
                        <strong style={{ color: '#f59e0b' }}>{formatCurrency(data?.pendingAmount)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
