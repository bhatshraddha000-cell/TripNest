import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdminUser } from '../lib/authUtils.js'
import { analyticsApi } from '../lib/analyticsApi.js'
import Navbar from '../components/dashboard/Navbar.jsx'
import Sidebar from '../components/dashboard/Sidebar.jsx'

const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#64748b', // slate
]

// Formatting Helpers
function formatCurrency(value) {
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '₹0'
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// 1. Smooth Responsive Line Chart for User Registration Trend
function ResponsiveLineChart({ rawTrend, rangeDays }) {
  const dataPoints = useMemo(() => {
    const points = []
    const today = new Date()
    
    // Generate dates backwards from today
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(today.getDate() - i)
      const dateStr = d.toISOString().split('T')[0] // yyyy-MM-dd
      const count = rawTrend?.[dateStr] ?? 0
      
      points.push({
        dateStr,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Number(count),
      })
    }
    return points
  }, [rawTrend, rangeDays])

  const maxVal = Math.max(...dataPoints.map((d) => d.value), 2)
  const totalRegistrations = dataPoints.reduce((sum, d) => sum + d.value, 0)

  // Chart Dimensions
  const width = 600
  const height = 220
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 30

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Coordinates mapping
  const points = dataPoints.map((dp, i) => {
    const x = paddingLeft + (i / (dataPoints.length - 1)) * chartWidth
    const y = paddingTop + chartHeight - (dp.value / maxVal) * chartHeight
    return { x, y, ...dp }
  })

  // Path data creation
  let linePath = ''
  let areaPath = ''
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} `
    for (let i = 1; i < points.length; i++) {
      linePath += `L ${points[i].x} ${points[i].y} `
    }

    areaPath = linePath + `L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
  }

  const [hoveredPoint, setHoveredPoint] = useState(null)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Trend line over past {rangeDays} days</span>
        <strong style={{ color: '#3b82f6' }}>Total: {totalRegistrations} user registrations</strong>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + ratio * chartHeight
          const val = Math.round(maxVal * (1 - ratio))
          return (
            <g key={ratio} opacity="0.6">
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                {val}
              </text>
            </g>
          )
        })}

        {/* Areas & Lines */}
        {points.length > 0 && (
          <>
            <path d={areaPath} fill="url(#area-gradient)" />
            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* Hover Markers and Interaction dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint?.dateStr === p.dateStr ? 7 : 4}
            fill={hoveredPoint?.dateStr === p.dateStr ? '#3b82f6' : '#ffffff'}
            stroke="#3b82f6"
            strokeWidth="3"
            style={{ cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* Tooltip Overlay inside SVG */}
        {hoveredPoint && (
          <g>
            <rect
              x={Math.max(10, Math.min(width - 130, hoveredPoint.x - 60))}
              y={Math.max(5, hoveredPoint.y - 45)}
              width="120"
              height="35"
              rx="6"
              fill="#1e293b"
              opacity="0.9"
            />
            <text
              x={Math.max(70, Math.min(width - 70, hoveredPoint.x))}
              y={Math.max(20, hoveredPoint.y - 32)}
              textAnchor="middle"
              fontSize="9"
              fill="#94a3b8"
              fontWeight="600"
            >
              {hoveredPoint.label}
            </text>
            <text
              x={Math.max(70, Math.min(width - 70, hoveredPoint.x))}
              y={Math.max(30, hoveredPoint.y - 20)}
              textAnchor="middle"
              fontSize="11"
              fill="#ffffff"
              fontWeight="800"
            >
              {hoveredPoint.value} Registered
            </text>
          </g>
        )}

        {/* X Axis Labels (Sampled for legibility) */}
        {points.filter((_, idx) => idx % Math.ceil(points.length / 5) === 0).map((p) => (
          <text key={p.dateStr} x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// 2. Custom vertical Bar Chart for monthly expenses or activity volume
function ResponsiveVerticalBarChart({ data, mode = 'currency' }) {
  const sortedKeys = Object.keys(data).sort()
  const chartData = sortedKeys.map((key) => ({
    label: key, // yyyy-MM
    value: data[key],
  }))

  const maxVal = Math.max(...chartData.map((d) => d.value), 1)

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
        <p>No platform transactions or activities recorded.</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '16px', height: '180px', alignItems: 'flex-end', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingLeft: '8px' }}>
        {chartData.map((item, idx) => {
          const heightPercent = (item.value / maxVal) * 100
          const displayValue = mode === 'currency' ? formatCurrency(item.value) : `${item.value} units`

          return (
            <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', transform: 'rotate(-25deg)', transformOrigin: 'bottom center', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                {displayValue}
              </div>
              <div
                style={{
                  width: '80%',
                  minWidth: '16px',
                  maxWidth: '36px',
                  height: `${heightPercent}%`,
                  backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                title={`${item.label}: ${displayValue}`}
              />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 3. Custom Svg Doughnut Chart Component
function SvgDoughnutChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = 35
  const circumference = 2 * Math.PI * radius
  let accumulatedPercent = 0

  const [hoveredIdx, setHoveredIdx] = useState(null)

  if (total === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>No items found.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          {data.map((item, idx) => {
            const percent = item.value / total
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
          <text x="50" y="47" textAnchor="middle" fontSize="6" fontWeight="bold" fill="var(--text-secondary)">
            TOTAL
          </text>
          <text x="50" y="56" textAnchor="middle" fontSize="8" fontWeight="800" fill="#1e293b">
            {total > 1000000 ? `${(total / 1000000).toFixed(1)}M` : total > 1000 ? `${Math.round(total / 1000)}k` : Math.round(total)}
          </text>
        </svg>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((item, idx) => {
          const percent = ((item.value / total) * 100).toFixed(1)
          const isHovered = hoveredIdx === idx

          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: isHovered ? 'rgba(0,0,0,0.03)' : 'transparent',
                transition: 'background-color 0.2s',
              }}
            >
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {item.displayValue || `${item.value} (${percent}%)`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 4. Custom Horizontal Bar Chart
function ResponsiveHorizontalBarChart({ data, maxValue }) {
  const maxVal = maxValue || Math.max(...data.map((d) => d.value), 1)

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
        <p>No statistics logged yet.</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', padding: '10px 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((item) => {
          const percentage = Math.min((item.value / maxVal) * 100, 100)

          return (
            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span>{item.label}</span>
                <span style={{ color: item.color || '#3b82f6' }}>{item.displayValue || item.value}</span>
              </div>
              <div style={{ width: '100%', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
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

function AdminDashboardPage() {
  const { user, logout, authLoading, isAuthenticated } = useAuth()
  
  // Dashboard Tabs: 'overview' | 'users' | 'trips'
  const [activeTab, setActiveTab] = useState('overview')
  
  // Filters State
  const [dateFilter, setDateFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [destFilter, setDestFilter] = useState('ALL')

  // Search States
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  const [userStatusFilter, setUserStatusFilter] = useState('ALL')

  const [tripSearch, setTripSearch] = useState('')
  const [tripStatusFilter, setTripStatusFilter] = useState('ALL')
  const [tripDestFilter, setTripDestFilter] = useState('ALL')

  // Data States
  const [overviewData, setOverviewData] = useState(null)
  const [usersList, setUsersList] = useState([])
  const [tripsList, setTripsList] = useState([])
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingTrips, setLoadingTrips] = useState(false)
  
  // Overlay Details States
  const [selectedUserDetails, setSelectedUserDetails] = useState(null)
  const [selectedTripDetails, setSelectedTripDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const [error, setError] = useState(null)

  // Fetch Dashboard Overview Metrics
  const fetchOverview = async () => {
    try {
      setLoadingOverview(true)
      setError(null)
      const data = await analyticsApi.getAdminAnalytics(dateFilter, statusFilter, destFilter)
      setOverviewData(data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch platform overview analytics.')
    } finally {
      setLoadingOverview(false)
    }
  }

  // Fetch User Management lists
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const data = await analyticsApi.getAdminUsers()
      setUsersList(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Fetch Trip Management lists
  const fetchTrips = async () => {
    try {
      setLoadingTrips(true)
      const data = await analyticsApi.getAdminTrips()
      setTripsList(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTrips(false)
    }
  }

  // Load appropriate data when tab or global filters change
  useEffect(() => {
    if (!isAuthenticated) return
    const isAdmin = isAdminUser(user)
    if (!isAdmin) return

    if (activeTab === 'overview') {
      fetchOverview()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'trips') {
      fetchTrips()
    }
  }, [isAuthenticated, user, activeTab, dateFilter, statusFilter, destFilter])

  // Get User details
  const handleViewUserDetail = async (userId) => {
    if (!userId) return
    setLoadingDetails(true)
    setError(null)
    try {
      const detail = await analyticsApi.getAdminUserDetails(userId)
      setSelectedUserDetails(detail)
    } catch (err) {
      console.error('Failed to load user details:', err)
      setError('Unable to load user details.')
    } finally {
      setLoadingDetails(false)
    }
  }
  const viewUserDetails = handleViewUserDetail

  // Get Trip details
  const viewTripDetails = async (tripId) => {
    try {
      setLoadingDetails(true)
      const details = await analyticsApi.getAdminTripDetails(tripId)
      setSelectedTripDetails(details)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetails(false)
    }
  }

  // Dynamic values list for Filter Bar (Drawn from database-driven lists)
  const uniqueDestinationsList = useMemo(() => {
    if (!overviewData?.popularDestinations) return []
    return overviewData.popularDestinations.map(d => d.destination)
  }, [overviewData])

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter
      const matchStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [usersList, userSearch, userRoleFilter, userStatusFilter])

  // Filtered Trips List
  const filteredTrips = useMemo(() => {
    return tripsList.filter((t) => {
      const matchSearch =
        t.title?.toLowerCase().includes(tripSearch.toLowerCase()) ||
        t.creatorName?.toLowerCase().includes(tripSearch.toLowerCase())
      const matchStatus = tripStatusFilter === 'ALL' || t.status === tripStatusFilter
      const matchDest = tripDestFilter === 'ALL' || t.destination === tripDestFilter
      return matchSearch && matchStatus && matchDest
    })
  }, [tripsList, tripSearch, tripStatusFilter, tripDestFilter])

  // Auth Protection Checks
  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const isAdmin = user?.roles?.includes('ADMIN') || user?.role === 'ADMIN'

  if (!authLoading && !isAdmin) {
    return (
      <div className="app-shell dashboard-layout">
        <div className="dashboard-shell">
          <Navbar userName={user?.fullName || 'Traveler'} userEmail={user?.email || ''} onLogout={logout} />
          <div className="dashboard-content">
            <Sidebar />
            <main className="dashboard-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <div className="dashboard-card" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center', color: '#dc2626' }}>
                <span style={{ fontSize: '3rem' }}>🚫</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '16px 0 8px 0' }}>Access Denied</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                  You do not have administrative permissions to view this dashboard. Please log in with a System Administrator account.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    )
  }

  // Pre-process overview charts variables
  const tripStatusDistributionData = overviewData
    ? [
        { label: 'Upcoming', value: overviewData.upcomingTrips, color: '#3b82f6' },
        { label: 'Ongoing', value: overviewData.ongoingTrips, color: '#10b981' },
        { label: 'Completed', value: overviewData.completedTrips, color: '#f59e0b' },
      ]
    : []

  const popularDestinationsChart = overviewData?.popularDestinations
    ? overviewData.popularDestinations.map((d, idx) => ({
        label: d.destination,
        value: d.tripCount,
        displayValue: `${d.tripCount} trip${d.tripCount > 1 ? 's' : ''}`,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
    : []

  const expenseCategoryChart = overviewData?.expensesByType
    ? Object.keys(overviewData.expensesByType).map((key, idx) => ({
        label: key,
        value: overviewData.expensesByType[key],
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
    : []

  const activityTypeChart = overviewData?.activitiesByType
    ? Object.keys(overviewData.activitiesByType).map((key, idx) => ({
        label: key,
        value: overviewData.activitiesByType[key],
        displayValue: `${overviewData.activitiesByType[key]} activities`,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
    : []

  const documentTypeChart = overviewData?.documentsByType
    ? Object.keys(overviewData.documentsByType).map((key, idx) => ({
        label: key,
        value: overviewData.documentsByType[key],
        color: CATEGORY_COLORS[(idx + 4) % CATEGORY_COLORS.length],
      }))
    : []

  const notificationTypeChart = overviewData?.notificationsByType
    ? Object.keys(overviewData.notificationsByType).map((key, idx) => ({
        label: key,
        value: overviewData.notificationsByType[key],
        color: CATEGORY_COLORS[(idx + 2) % CATEGORY_COLORS.length],
      }))
    : []

  // Recent tables variables
  const recentUsersList = usersList.slice(0, 5)
  const recentTripsList = tripsList.slice(0, 5)

  return (
    <div className="app-shell dashboard-layout">
      <div className="dashboard-shell">
        <Navbar userName={user?.fullName || 'Admin'} userEmail={user?.email || ''} onLogout={logout} />

        <div className="dashboard-content">
          <Sidebar />

          <main className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Title Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>Platform Admin Dashboard</h1>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Platform-wide metrics, system analytics, user accounts, and trip scheduling overview.
                </p>
              </div>

              {/* Tab Navigation Controls */}
              <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '10px', gap: '4px' }}>
                <button
                  onClick={() => setActiveTab('overview')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'overview' ? '#ffffff' : 'transparent',
                    color: activeTab === 'overview' ? '#1e293b' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'overview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'users' ? '#ffffff' : 'transparent',
                    color: activeTab === 'users' ? '#1e293b' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'users' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('trips')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'trips' ? '#ffffff' : 'transparent',
                    color: activeTab === 'trips' ? '#1e293b' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'trips' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Trips
                </button>
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* ========================================================== */}
            {/* OVERVIEW TAB VIEW */}
            {/* ========================================================== */}
            {activeTab === 'overview' && (
              <>
                {/* Global Filters Control Bar */}
                <div className="dashboard-card" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Global Filters:</div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label htmlFor="date-range-filter" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Date Range:</label>
                    <select
                      id="date-range-filter"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600 }}
                    >
                      <option value="ALL">All Time</option>
                      <option value="last7days">Last 7 Days</option>
                      <option value="last30days">Last 30 Days</option>
                      <option value="last3months">Last 3 Months</option>
                      <option value="last6months">Last 6 Months</option>
                      <option value="lastyear">Last Year</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label htmlFor="trip-status-filter" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Trip Status:</label>
                    <select
                      id="trip-status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600 }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label htmlFor="destination-filter" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Destination:</label>
                    <select
                      id="destination-filter"
                      value={destFilter}
                      onChange={(e) => setDestFilter(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600 }}
                    >
                      <option value="ALL">All Destinations</option>
                      {uniqueDestinationsList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {(dateFilter !== 'ALL' || statusFilter !== 'ALL' || destFilter !== 'ALL') && (
                    <button
                      onClick={() => { setDateFilter('ALL'); setStatusFilter('ALL'); setDestFilter('ALL'); }}
                      style={{ border: 'none', backgroundColor: 'transparent', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {loadingOverview ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <>
                    {/* Platform Summary Statistics Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Users</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', margin: '4px 0' }}>{overviewData?.totalUsers}</div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>+{overviewData?.newUsersLast7Days} past 7d</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Trips</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', margin: '4px 0' }}>{overviewData?.totalTrips}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Includes {overviewData?.groupTrips} group trips</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Upcoming Trips</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', margin: '4px 0' }}>{overviewData?.upcomingTrips}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scheduled upcoming</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Ongoing Trips</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>{overviewData?.ongoingTrips}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Actively traveling now</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Completed Trips</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', margin: '4px 0' }}>{overviewData?.completedTrips}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Successfully archived</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Unique Destinations</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', margin: '4px 0' }}>{overviewData?.totalDestinations}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distinct global targets</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Activities</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', margin: '4px 0' }}>{overviewData?.totalActivities}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Scheduled events</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Expenses</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', margin: '4px 0' }}>{overviewData?.totalExpenses}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Platform total entries</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Travel Documents</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4', margin: '4px 0' }}>{overviewData?.totalDocuments}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Uploaded attachments</div>
                      </div>

                      <div className="dashboard-card" style={{ padding: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Trip Memberships</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ec4899', margin: '4px 0' }}>{overviewData?.totalTripMemberships}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total membership joints</div>
                      </div>
                    </div>

                    {/* Chart Layout Sections */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '12px' }}>
                      
                      {/* User Registration Trend */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>User Registration Trend</h3>
                        <ResponsiveLineChart rawTrend={overviewData?.userRegistrationTrend} rangeDays={dateFilter === 'last7days' ? 7 : dateFilter === 'last30days' ? 30 : dateFilter === 'last3months' ? 90 : 30} />
                      </div>

                      {/* User Engagement Breakdowns */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>User Engagement & Participation</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: 600 }}>Active Users in Trips</span>
                            <strong>{overviewData?.activeUsers}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: 600 }}>Users Participating in Trips (Unique)</span>
                            <strong>{overviewData?.uniqueUsersInTrips}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: 600 }}>Users Who Created Trips</span>
                            <strong>{overviewData?.usersWhoCreatedTrips}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                            <span style={{ fontWeight: 600 }}>Total Trip Memberships</span>
                            <strong>{overviewData?.totalTripMemberships}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 600 }}>Average Members per Trip</span>
                            <strong style={{ color: '#3b82f6', fontSize: '1.1rem' }}>{overviewData?.averageMembersPerTrip.toFixed(1)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                      {/* Trip Status doughnut */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Trip Status Distribution</h3>
                        <SvgDoughnutChart data={tripStatusDistributionData} />
                      </div>

                      {/* Popular Destinations */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Popular Destinations</h3>
                        <ResponsiveHorizontalBarChart data={popularDestinationsChart} />
                      </div>

                      {/* Expense breakdowns */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Document Analytics</h3>
                        <SvgDoughnutChart data={documentTypeChart} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                      {/* Expenses by month */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Monthly Expenses Volume</h3>
                        <ResponsiveVerticalBarChart data={overviewData?.expensesByMonth ?? {}} mode="currency" />
                      </div>

                      {/* Activities breakdown */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Activity Volume by Type</h3>
                        <ResponsiveHorizontalBarChart data={activityTypeChart} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                      {/* Activities by month */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Monthly Scheduled Activities</h3>
                        <ResponsiveVerticalBarChart data={overviewData?.activitiesByMonth ?? {}} mode="count" />
                      </div>

                      {/* Notification Analytics */}
                      <div className="dashboard-card" style={{ padding: '24px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Notification System Analytics</h3>
                        <SvgDoughnutChart data={notificationTypeChart} />
                      </div>
                    </div>

                    {/* Recent tables (latest entities in DB) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                      
                      {/* Recent users table */}
                      <div className="dashboard-card" style={{ padding: '24px', overflowX: 'auto' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Recent Registered Users</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                              <th style={{ padding: '8px' }}>Name</th>
                              <th style={{ padding: '8px' }}>Email</th>
                              <th style={{ padding: '8px' }}>Role</th>
                              <th style={{ padding: '8px' }}>Created</th>
                              <th style={{ padding: '8px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentUsersList.map((ru) => (
                              <tr key={ru.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px', fontWeight: 600 }}>{ru.fullName}</td>
                                <td style={{ padding: '8px' }}>{ru.email}</td>
                                <td style={{ padding: '8px' }}><span className={`badge ${ru.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>{ru.role}</span></td>
                                <td style={{ padding: '8px' }}>{formatDate(ru.createdAt)}</td>
                                <td style={{ padding: '8px' }}>
                                  <button onClick={() => { setActiveTab('users'); viewUserDetails(ru.id); }} style={{ border: 'none', backgroundColor: '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Recent trips table */}
                      <div className="dashboard-card" style={{ padding: '24px', overflowX: 'auto' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800 }}>Recent Scheduled Trips</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                              <th style={{ padding: '8px' }}>Trip</th>
                              <th style={{ padding: '8px' }}>Creator</th>
                              <th style={{ padding: '8px' }}>Destination</th>
                              <th style={{ padding: '8px' }}>Status</th>
                              <th style={{ padding: '8px' }}>Budget</th>
                              <th style={{ padding: '8px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentTripsList.map((rt) => (
                              <tr key={rt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px', fontWeight: 600 }}>{rt.title}</td>
                                <td style={{ padding: '8px' }}>{rt.creatorName}</td>
                                <td style={{ padding: '8px' }}>{rt.destination}</td>
                                <td style={{ padding: '8px' }}><span className="badge" style={{ backgroundColor: rt.status === 'ONGOING' ? '#10b981' : rt.status === 'UPCOMING' ? '#3b82f6' : '#64748b', color: '#fff', padding: '2px 6px', fontSize: '0.7rem' }}>{rt.status}</span></td>
                                <td style={{ padding: '8px', fontWeight: 700 }}>{formatCurrency(rt.budget)}</td>
                                <td style={{ padding: '8px' }}>
                                  <button onClick={() => { setActiveTab('trips'); viewTripDetails(rt.id); }} style={{ border: 'none', backgroundColor: '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ========================================================== */}
            {/* USER MANAGEMENT TAB VIEW */}
            {/* ========================================================== */}
            {activeTab === 'users' && (
              <>
                {/* Search & Filter Controls */}
                <div className="dashboard-card" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', minWidth: '240px' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Role:</label>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600 }}
                    >
                      <option value="ALL">All Roles</option>
                      <option value="TRAVELER">Traveler</option>
                      <option value="GROUP_ADMIN">Group Admin</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</label>
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600 }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Users List Table */}
                {loadingUsers ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <div className="dashboard-card" style={{ padding: '24px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ overflowX: 'auto', width: '100%', borderRadius: '10px' }}>
                      <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary, #64748b)' }}>
                            <th style={{ padding: '14px 16px', minWidth: '150px' }}>Name</th>
                            <th style={{ padding: '14px 16px', minWidth: '220px' }}>Email</th>
                            <th style={{ padding: '14px 16px', minWidth: '130px', whiteSpace: 'nowrap' }}>System Role</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', minWidth: '120px', whiteSpace: 'nowrap' }}>Trips Created</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', minWidth: '110px', whiteSpace: 'nowrap' }}>Trips Joined</th>
                            <th style={{ padding: '14px 16px', minWidth: '100px', whiteSpace: 'nowrap' }}>Status</th>
                            <th style={{ padding: '14px 16px', minWidth: '140px', whiteSpace: 'nowrap' }}>Registered Date</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', minWidth: '130px', whiteSpace: 'nowrap' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>{u.fullName}</td>
                              <td style={{ padding: '14px 16px', color: 'var(--text-secondary, #475569)' }}>{u.email}</td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                <span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'}`} style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px' }}>
                                  {u.role === 'ADMIN' ? 'System Admin' : u.role}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: '#3b82f6' }}>{u.tripsCreatedCount}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: '#10b981' }}>{u.tripsJoinedCount}</td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>● Active</span>
                              </td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: 'var(--text-secondary, #64748b)' }}>{formatDate(u.createdAt)}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button
                                  onClick={() => handleViewUserDetail(u.id)}
                                  style={{
                                    border: 'none',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                                    transition: 'background-color 0.2s',
                                  }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredUsers.length === 0 && (
                            <tr>
                              <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                                No users match search or filter selections.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================== */}
            {/* TRIP MANAGEMENT TAB VIEW */}
            {/* ========================================================== */}
            {activeTab === 'trips' && (
              <>
                {/* Search & Filter Controls */}
                <div className="dashboard-card" style={{ padding: '16px 24px', width: '100%', boxSizing: 'border-box', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search trip or creator..."
                    value={tripSearch}
                    onChange={(e) => setTripSearch(e.target.value)}
                    style={{ flex: '1 1 260px', minWidth: '240px', padding: '10px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                  />

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</label>
                    <select
                      value={tripStatusFilter}
                      onChange={(e) => setTripStatusFilter(e.target.value)}
                      style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Destination:</label>
                    <select
                      value={tripDestFilter}
                      onChange={(e) => setTripDestFilter(e.target.value)}
                      style={{ padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}
                    >
                      <option value="ALL">All Destinations</option>
                      {Array.from(new Set(tripsList.map(t => t.destination).filter(Boolean))).map((dest) => (
                        <option key={dest} value={dest}>{dest}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Trips List Table */}
                {loadingTrips ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <div className="dashboard-card" style={{ padding: '24px', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ overflowX: 'auto', width: '100%', borderRadius: '10px' }}>
                      <table style={{ width: '100%', minWidth: '1050px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-secondary, #64748b)' }}>
                            <th style={{ padding: '14px 16px', minWidth: '160px' }}>Trip Name</th>
                            <th style={{ padding: '14px 16px', minWidth: '180px' }}>Creator</th>
                            <th style={{ padding: '14px 16px', minWidth: '140px' }}>Destination</th>
                            <th style={{ padding: '14px 16px', textAlign: 'center', minWidth: '90px', whiteSpace: 'nowrap' }}>Members</th>
                            <th style={{ padding: '14px 16px', minWidth: '110px', whiteSpace: 'nowrap' }}>Status</th>
                            <th style={{ padding: '14px 16px', minWidth: '120px', whiteSpace: 'nowrap' }}>Start Date</th>
                            <th style={{ padding: '14px 16px', minWidth: '120px', whiteSpace: 'nowrap' }}>End Date</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', minWidth: '110px', whiteSpace: 'nowrap' }}>Budget</th>
                            <th style={{ padding: '14px 16px', minWidth: '130px', whiteSpace: 'nowrap' }}>Created Date</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right', minWidth: '120px', whiteSpace: 'nowrap' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTrips.map((t) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>{t.title}</td>
                              <td style={{ padding: '14px 16px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>{t.creatorName}</div>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #64748b)' }}>{t.creatorEmail}</span>
                              </td>
                              <td style={{ padding: '14px 16px', color: 'var(--text-secondary, #475569)' }}>{t.destination}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: '#3b82f6' }}>{t.membersCount}</td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                                <span className="badge" style={{ backgroundColor: t.status === 'ONGOING' ? '#10b981' : t.status === 'UPCOMING' ? '#3b82f6' : '#64748b', color: '#fff', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px' }}>
                                  {t.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: 'var(--text-secondary, #64748b)' }}>{formatDate(t.startDate)}</td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: 'var(--text-secondary, #64748b)' }}>{formatDate(t.endDate)}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, color: '#10b981', whiteSpace: 'nowrap' }}>{formatCurrency(t.budget)}</td>
                              <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: 'var(--text-secondary, #64748b)' }}>{formatDate(t.createdAt)}</td>
                              <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <button
                                  onClick={() => viewTripDetails(t.id)}
                                  style={{
                                    border: 'none',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
                                    transition: 'background-color 0.2s',
                                  }}
                                >
                                  View Trip
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredTrips.length === 0 && (
                            <tr>
                              <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                No scheduled trips match your search or filter selections.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ========================================================== */}
            {/* OVERLAY DETAILS POPUPS (MODALS) */}
            {/* ========================================================== */}

            {/* A. User Details Overlay Popup */}
            {selectedUserDetails && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
                <div className="dashboard-card" style={{ padding: '28px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <button onClick={() => setSelectedUserDetails(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', backgroundColor: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                  
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>User Administration Details</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Overview profile and activity logs for this user.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>FULL NAME</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedUserDetails.fullName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>EMAIL ADDRESS</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedUserDetails.email}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SYSTEM ROLE</div>
                      <span className={`badge ${selectedUserDetails.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                        {selectedUserDetails.role}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>REGISTRATION DATE</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{formatDate(selectedUserDetails.createdAt)}</div>
                    </div>
                  </div>

                  {/* Summary Activities counter */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '1.25rem', display: 'block' }}>{selectedUserDetails.tripsCreatedCount}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Trips Created</span>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '1.25rem', display: 'block' }}>{selectedUserDetails.tripsJoinedCount}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Trips Joined</span>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '1.25rem', display: 'block' }}>{selectedUserDetails.activitiesCount}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Activities Mapped</span>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '1.25rem', display: 'block' }}>{selectedUserDetails.expensesCount}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Expenses Logged</span>
                    </div>
                  </div>

                  {/* Associated Trips list */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700 }}>Associated Scheduled Trips ({selectedUserDetails.trips?.length || 0})</h4>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedUserDetails.trips?.map((t) => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <div>
                            <strong style={{ display: 'block' }}>{t.title}</strong>
                            <span style={{ color: 'var(--text-secondary)' }}>{t.destination} ({formatDate(t.startDate)} - {formatDate(t.endDate)})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge" style={{ backgroundColor: '#64748b', color: '#fff', fontSize: '0.65rem' }}>{t.role}</span>
                            <span className="badge" style={{ backgroundColor: t.status === 'ONGOING' ? '#10b981' : t.status === 'UPCOMING' ? '#3b82f6' : '#64748b', color: '#fff', fontSize: '0.65rem' }}>{t.status}</span>
                          </div>
                        </div>
                      ))}
                      {(!selectedUserDetails.trips || selectedUserDetails.trips.length === 0) && (
                        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No trips registered for this user yet.</div>
                      )}
                    </div>
                  </div>

                  <button onClick={() => setSelectedUserDetails(null)} style={{ border: 'none', backgroundColor: '#e2e8f0', color: '#475569', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>
                    Close View
                  </button>
                </div>
              </div>
            )}

            {/* B. Trip Details Overlay Popup */}
            {selectedTripDetails && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' }}>
                <div className="dashboard-card" style={{ padding: '28px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <button onClick={() => setSelectedTripDetails(null)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', backgroundColor: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>

                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Trip Administration Overview</h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage and view trip membership details and metadata.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TRIP NAME</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedTripDetails.title}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DESTINATION</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>{selectedTripDetails.destination}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CREATOR / GROUP ADMIN</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                        {selectedTripDetails.creatorName} ({selectedTripDetails.creatorEmail})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SCHEDULE DATES</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                        {formatDate(selectedTripDetails.startDate)} - {formatDate(selectedTripDetails.endDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>BUDGET</div>
                      <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>{formatCurrency(selectedTripDetails.budget)}</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CURRENT SPENDING</div>
                      <strong style={{ color: '#ef4444', fontSize: '1.1rem' }}>{formatCurrency(selectedTripDetails.currentExpenses)}</strong>
                    </div>
                  </div>

                  {/* Summary statistics counters */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '1.25rem', display: 'block' }}>{selectedTripDetails.membersCount}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Members</span>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '1.25rem', display: 'block' }}>{selectedTripDetails.activitiesCount}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Activities</span>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <strong style={{ fontSize: '1.25rem', display: 'block' }}>{selectedTripDetails.documentsCount}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Documents</span>
                    </div>
                  </div>

                  {/* Trip members list */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 700 }}>Trip Members List</h4>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {selectedTripDetails.members.map((m) => (
                        <div key={m.email} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem', alignItems: 'center' }}>
                          <div>
                            <strong style={{ display: 'block' }}>{m.name}</strong>
                            <span style={{ color: 'var(--text-secondary)' }}>{m.email}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge" style={{ backgroundColor: m.tripRole === 'GROUP_ADMIN' ? '#8b5cf6' : '#cbd5e1', color: m.tripRole === 'GROUP_ADMIN' ? '#fff' : '#475569', fontSize: '0.7rem' }}>
                              {m.tripRole === 'GROUP_ADMIN' ? 'Group Admin' : 'Member'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Joined: {formatDate(m.joinedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setSelectedTripDetails(null)} style={{ border: 'none', backgroundColor: '#e2e8f0', color: '#475569', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end' }}>
                    Close View
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
