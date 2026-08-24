
import { Route, Routes, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import LoginPage from './pages/LoginPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

import TripsListPage from './pages/TripsListPage.jsx'
import CreateTripPage from './pages/CreateTripPage.jsx'
import EditTripPage from './pages/EditTripPage.jsx'
import TripDetailsPage from './pages/TripDetailsPage.jsx'

import ComingSoonPage from './pages/ComingSoonPage.jsx'
import ItineraryPage from './pages/ItineraryPage.jsx'
import ActivitySchedulerPage from './pages/ActivitySchedulerPage.jsx'

import DestinationsPage from './pages/DestinationsPage.jsx'
import DestinationDetailsPage from './pages/DestinationDetailsPage.jsx'
import AttractionDetailsPage from './pages/AttractionDetailsPage.jsx'
import PublicDestinationDetailsPage from './pages/PublicDestinationDetailsPage.jsx'

import AnalyticsPage from './pages/AnalyticsPage.jsx'
import AdminDashboardPage from './pages/AdminDashboardPage.jsx'

import ContactPage from './pages/ContactPage.jsx'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.jsx'
import TermsPage from './pages/TermsPage.jsx'

import './App.css'

function App() {
  return (
    <Routes>

      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />

      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Analytics */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Trips */}
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <TripsListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/new"
        element={
          <ProtectedRoute>
            <CreateTripPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/:id"
        element={
          <ProtectedRoute>
            <TripDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trips/:id/edit"
        element={
          <ProtectedRoute>
            <EditTripPage />
          </ProtectedRoute>
        }
      />

      {/* Itinerary */}
      <Route
        path="/itinerary/:tripId"
        element={
          <ProtectedRoute>
            <ItineraryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/itinerary"
        element={
          <ProtectedRoute>
            <ItineraryPage />
          </ProtectedRoute>
        }
      />

      {/* Activity Scheduler */}
      <Route
        path="/activity-scheduler/:itineraryId"
        element={
          <ProtectedRoute>
            <ActivitySchedulerPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/activity-scheduler"
        element={
          <ProtectedRoute>
            <ActivitySchedulerPage />
          </ProtectedRoute>
        }
      />

      {/* Explore */}
      <Route
        path="/explore/:destinationName"
        element={<PublicDestinationDetailsPage />}
      />

      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <ComingSoonPage title="Explore Destinations" />
          </ProtectedRoute>
        }
      />

      {/* Destinations */}
      <Route
        path="/destinations"
        element={
          <ProtectedRoute>
            <DestinationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/destinations/:tripId"
        element={
          <ProtectedRoute>
            <DestinationDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Attraction */}
      <Route
        path="/attraction/:xid"
        element={
          <ProtectedRoute>
            <AttractionDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  )
}

export default App
