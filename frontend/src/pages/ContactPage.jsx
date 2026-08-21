import { useState, useEffect } from 'react'
import Navbar from '../components/landing/Navbar.jsx'
import Footer from '../components/landing/Footer.jsx'
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react'
import './LegalPages.css'

function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) return
    setSubmitted(true)
  }

  return (
    <div className="legal-page">
      <Navbar />

      <main className="legal-main">
        <div className="legal-header">
          <h1 className="legal-title">Contact Us</h1>
          <p className="legal-subtitle">
            Have a question or need help with your travel planning experience? We're happy to hear from you.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-card">
            <h2 className="contact-card-title">
              <Mail size={22} color="var(--accent)" />
              Get in Touch
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--paragraph)', marginBottom: '20px', lineHeight: 1.6 }}>
              For inquiries, support requests, or platform feedback, please send us an email at our official address:
            </p>

            <div className="contact-email-box">
              <div className="contact-email-icon">
                <Mail size={22} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Official Email
                </span>
                <a href="mailto:tripnestofficial@gmail.com" className="contact-email-link">
                  tripnestofficial@gmail.com
                </a>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '16px 0 12px' }}>
              TripNest Support Areas
            </h3>
            <ul className="contact-topics-list">
              <li className="contact-topic-item">
                <span className="contact-topic-dot"></span>
                <span>Trip planning & organization</span>
              </li>
              <li className="contact-topic-item">
                <span className="contact-topic-dot"></span>
                <span>Itineraries & activity scheduling</span>
              </li>
              <li className="contact-topic-item">
                <span className="contact-topic-dot"></span>
                <span>Expenses & group splitting</span>
              </li>
              <li className="contact-topic-item">
                <span className="contact-topic-dot"></span>
                <span>Account, profile & login assistance</span>
              </li>
              <li className="contact-topic-item">
                <span className="contact-topic-dot"></span>
                <span>Feature requests & feedback</span>
              </li>
            </ul>
          </div>

          <div className="contact-card">
            <h2 className="contact-card-title">
              <MessageSquare size={22} color="var(--accent)" />
              Send a Message
            </h2>

            {submitted ? (
              <div className="contact-success-msg">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, color: 'var(--accent-2)' }}>
                  <CheckCircle size={20} />
                  <span>Message Received!</span>
                </div>
                Thank you for reaching out. We have received your message and will respond to <strong>{formData.email}</strong> as soon as possible.
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-group">
                  <label htmlFor="contact-name">Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    className="contact-form-input"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-email">Your Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    className="contact-form-input"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-subject">Subject</label>
                  <input
                    id="contact-subject"
                    type="text"
                    className="contact-form-input"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    className="contact-form-textarea"
                    placeholder="Describe your inquiry..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="contact-submit-btn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Send size={16} />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="legal-disclaimer-box">
          <strong>Note:</strong> Support channels and contact options are provided for user convenience and may be updated as TripNest evolves.
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactPage
