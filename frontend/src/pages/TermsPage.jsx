import { useEffect } from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { FileText } from 'lucide-react'
import './LegalPages.css'

function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="legal-page">
      <Navbar />

      <main className="legal-main">
        <div className="legal-header">
          <h1 className="legal-title">Terms & Conditions</h1>
          <p className="legal-subtitle">
            Please read these Terms & Conditions carefully before using the TripNest web application.
          </p>
          <span className="legal-date-badge">Last Updated: August 18, 2026</span>
        </div>

        <div className="legal-card">
          <section className="legal-section">
            <h2>
              <FileText size={20} color="var(--accent)" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the TripNest application, creating an account, or interacting with our services, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use the application.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. About TripNest</h2>
            <p>
              TripNest is a web-based travel planning and trip management platform. The application provides tools to organize trip details, manage daily itineraries, schedule activities, calculate trip budgets, track expenses, split costs among group members, and store travel documents.
            </p>
          </section>

          <section className="legal-section">
            <h2>3. User Accounts</h2>
            <p>
              When creating a TripNest account, you agree to provide accurate and current information. You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. Notify us immediately if you suspect unauthorized access.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Acceptable Use</h2>
            <p>
              You agree to use TripNest only for lawful travel planning and organization purposes. You agree not to:
            </p>
            <ul>
              <li>Attempt to gain unauthorized access to other user accounts or system networks.</li>
              <li>Upload malicious code, viruses, or harmful software.</li>
              <li>Interfere with or disrupt the security or integrity of the platform.</li>
              <li>Engage in automated scraping, spamming, or fraudulent activity.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Trips and Travel Information</h2>
            <p>
              Users are solely responsible for the accuracy of dates, destinations, budgets, itineraries, and activities created within their trips. TripNest is an organization and planning tool and does not sell, book, or guarantee real-world flight tickets, hotel reservations, or third-party tour services.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Group Trips and Shared Information</h2>
            <p>
              TripNest offers group collaboration features. Information added to a shared trip (including itinerary activities, shared expenses, chat messages, and uploaded documents) will be visible to co-travelers who have been invited to or joined that trip.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Uploaded Documents and Content</h2>
            <p>
              You retain ownership of any travel documents, images, or notes you upload to TripNest. By uploading content, you represent that you have the right to upload such material and that it does not infringe on third-party rights or violate applicable laws.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Expenses and Budgets</h2>
            <p>
              Expense tracking and budget calculation tools are provided to assist in financial organization. Users are responsible for verifying the accuracy of their entered figures and financial arrangements made with fellow co-travelers.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Notifications and Emails</h2>
            <p>
              TripNest may deliver service notifications, trip reminders, and transactional account emails. You can manage certain notification interactions within your account settings.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Availability of the Service</h2>
            <p>
              We strive to keep TripNest available and reliable. However, the service is provided on an "as is" and "as available" basis. Features may be updated, expanded, temporarily unavailable due to maintenance, or modified as the platform evolves.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Third-Party Services</h2>
            <p>
              TripNest integrates mapping and geolocation data from third-party providers (such as Leaflet and OpenStreetMap) to display destinations and interactive maps. Your use of map features may be subject to the terms of those service providers.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Intellectual Property</h2>
            <p>
              The TripNest name, brand mark, user interface design, logos, and original codebase are the property of TripNest. You may not copy, reproduce, or distribute core application assets without permission.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Limitation of Responsibility</h2>
            <p>
              TripNest is designed to assist users in planning and managing travel details. TripNest is not liable for real-world travel delays, missed flights, booking cancellations, or third-party service failures incurred during your travels.
            </p>
          </section>

          <section className="legal-section">
            <h2>14. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms & Conditions or engage in harmful activities that disrupt the platform for other users.
            </p>
          </section>

          <section className="legal-section">
            <h2>15. Changes to Terms</h2>
            <p>
              These Terms & Conditions may be updated periodically. Continued use of TripNest after changes are posted constitutes acceptance of the revised terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>16. Contact</h2>
            <p>
              If you have any questions regarding these Terms & Conditions, please contact us at:
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

export default TermsPage
