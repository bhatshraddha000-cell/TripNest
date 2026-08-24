import { useEffect } from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { ShieldCheck } from 'lucide-react'
import './LegalPages.css'

function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="legal-page">
      <Navbar />

      <main className="legal-main">
        <div className="legal-header">
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-subtitle">
            Learn how TripNest protects, uses, and respects your data as you plan and manage your travels.
          </p>
          <span className="legal-date-badge">Last Updated: August 18, 2026</span>
        </div>

        <div className="legal-card">
          <section className="legal-section">
            <h2>
              <ShieldCheck size={20} color="var(--accent)" />
              1. Introduction
            </h2>
            <p>
              TripNest is a comprehensive travel planning and trip management application designed to help individuals and groups organize trips, build itineraries, schedule activities, track shared expenses, and store travel documents in one place.
            </p>
            <p>
              This Privacy Policy explains what information we collect, how it is used, and how your data is handled when you use the TripNest web platform.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>
              TripNest only collects information that is directly relevant to providing our trip planning and collaboration services. This includes:
            </p>
            <ul>
              <li><strong>Account Credentials & Profile Info:</strong> Full name, email address, password hash, and optional profile picture.</li>
              <li><strong>Trip Details:</strong> Destinations, start and end dates, trip budgets, descriptions, and cover images.</li>
              <li><strong>Itineraries & Activities:</strong> Scheduled days, activity titles, locations, notes, times, and attraction bookmarks.</li>
              <li><strong>Expense Records:</strong> Expense titles, amounts, payment dates, split details among group members, and categories.</li>
              <li><strong>Group Collaboration Data:</strong> Trip invitations, member roles, group chat messages, and member status.</li>
              <li><strong>Uploaded Documents:</strong> Travel passes, booking vouchers, PDFs, or images uploaded to specific trips or activities.</li>
              <li><strong>Notifications & Activity Logs:</strong> System alerts, reminder preferences, and recent trip updates.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Information</h2>
            <p>
              We use your information strictly to operate, maintain, and enhance the TripNest application:
            </p>
            <ul>
              <li>To create and authenticate user accounts and manage secure sessions.</li>
              <li>To organize your trips, compute total budgets, track real-time expenses, and summarize financial metrics.</li>
              <li>To facilitate group trip collaboration by allowing members to join trips, view shared itineraries, and split costs.</li>
              <li>To send automated service emails, such as password reset tokens and upcoming trip reminders.</li>
              <li>To improve user experience, resolve technical issues, and evaluate application performance.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Authentication and Account Security</h2>
            <p>
              Account security is vital to us. User credentials are authenticated using industry-standard token mechanisms (JSON Web Tokens). Passwords are never stored in plain text. Secure token storage in client local storage enables seamless session persistence.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Uploaded Documents</h2>
            <p>
              TripNest allows users to upload supporting files (such as tickets, booking confirmations, or travel notes) to trips and activities. Uploaded documents are stored to allow access during travel planning.
            </p>
            <p>
              Users are advised to avoid uploading sensitive identification documents or financial statements that are not necessary for trip planning purposes.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Email Communication</h2>
            <p>
              TripNest may send transactional and service-related emails to your registered email address. These include:
            </p>
            <ul>
              <li>Password reset confirmation links.</li>
              <li>Trip reminder notifications prior to your travel start date.</li>
              <li>Collaboration invitations from fellow travelers.</li>
            </ul>
            <p>We do not send unsolicited promotional spam to your email.</p>
          </section>

          <section className="legal-section">
            <h2>7. Data Sharing</h2>
            <p>
              TripNest does not sell, rent, or trade your personal information to third-party marketers or advertisers.
            </p>
            <p>
              Your trip details (such as itineraries, activities, expenses, and documents) are shared only with users whom you explicitly invite or accept as co-travelers in your group trips.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Data Retention</h2>
            <p>
              We retain your account profile, trip data, itineraries, and expenses for as long as your account remains active or as needed to provide you with travel management functionality. You can delete or modify trip information at any time within the application.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. User Rights and Account Data</h2>
            <p>
              You have full control over your stored data. Through your TripNest account settings and trip pages, you can:
            </p>
            <ul>
              <li>Access and update your profile name, email, and avatar image.</li>
              <li>Edit or delete trip plans, itinerary entries, expenses, and uploaded documents.</li>
              <li>Leave group trips or manage group member permissions.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>10. Cookies and Local Storage</h2>
            <p>
              TripNest utilizes browser Local Storage and Session Storage to preserve your active login session and remember your preferred theme state (Light Mode vs. Dark Mode). We do not use intrusive third-party tracking cookies.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Security</h2>
            <p>
              We implement reasonable technical and organizational measures to safeguard user data against unauthorized access, loss, or alteration. However, no internet transmission or electronic storage method is guaranteed to be 100% secure.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Children's Privacy</h2>
            <p>
              TripNest is designed for general audiences and is not directed at children under the age of 13. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Changes to this Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect enhancements in the application. Any updates will be posted on this page with a revised "Last Updated" date.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Contact Us</h2>
            <p>
              If you have any questions or feedback regarding this Privacy Policy or how your data is handled, please contact us at:
            </p>
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:tripnestofficial@gmail.com" className="contact-email-link">
                tripnestofficial@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="legal-disclaimer-box">
          These policies are provided for informational purposes and may be updated as TripNest evolves.
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default PrivacyPolicyPage
