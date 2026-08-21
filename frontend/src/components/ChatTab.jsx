import { useEffect, useRef, useState } from 'react'
import { chatApi } from '../lib/chatApi.js'
import { useTheme } from '../context/ThemeContext.jsx'

function ChatTab({ tripId, currentUserId, tripTitle, destination, memberCount }) {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const pollIntervalRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const data = await chatApi.getMessages(tripId)
      setMessages(data)
      setError('')
    } catch (err) {
      if (err?.response?.status === 403) {
        setError('You are not a member of this trip.')
      } else {
        setError(err?.response?.data?.message ?? 'Failed to load chat messages.')
      }
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages(true)

    // Poll for new messages every 6 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(false)
    }, 6000)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [tripId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      setError('')
      const sentMsg = await chatApi.sendMessage(tripId, newMessage.trim())
      setMessages((prev) => [...prev, sentMsg])
      setNewMessage('')
      scrollToBottom()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name) => {
    return (name || 'U')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '620px', backgroundColor: 'var(--card-bg, rgba(255,255,255,0.02))', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', backgroundColor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)' }}>
            💬 Group Chat
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {tripTitle ? `${tripTitle}${destination ? ` • ${destination}` : ''}` : 'Trip Conversation'}
          </p>
        </div>
        {memberCount && (
          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            👥 {memberCount} {memberCount === 1 ? 'traveler' : 'travelers'}
          </span>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="status-message error" style={{ margin: '12px 24px 0 24px', padding: '10px 14px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Message Area */}
      <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading chat...</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.8rem', margin: '0 0 8px 0' }}>💬</p>
            <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text)', marginBottom: '4px' }}>No messages yet</strong>
            <span style={{ fontSize: '0.88rem' }}>Start the conversation with your trip group.</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUserId && String(msg.senderId) === String(currentUserId)
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                {!isMe && (
                  <span style={{ fontSize: '0.78rem', color: isDarkMode ? '#cbd5e1' : '#334155', marginBottom: '4px', marginLeft: '4px', fontWeight: 600 }}>
                    {msg.senderName}
                  </span>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end'
                  }}
                >
                  {!isMe && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1f6e8a, #4bbf7b)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}
                    >
                      {getInitials(msg.senderName)}
                    </div>
                  )}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe
                        ? 'linear-gradient(135deg, #1f6e8a, #0f4c64)'
                        : isDarkMode
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#e2e8f0',
                      color: isMe ? '#ffffff' : isDarkMode ? '#f8fafc' : '#0f172a',
                      border: isMe
                        ? 'none'
                        : isDarkMode
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid #cbd5e1',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.93rem',
                      lineHeight: '1.45',
                      fontWeight: isMe ? 'normal' : 500
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    marginTop: '4px',
                    marginRight: isMe ? '4px' : '0',
                    marginLeft: !isMe ? '44px' : '0'
                  }}
                >
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '16px 24px',
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.15)' : '#f8fafc',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <textarea
          rows="1"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending || !!(error && error.includes('not a member'))}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
            color: 'var(--text)',
            fontSize: '0.93rem',
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'none'
          }}
        />
        <button
          className="primary-button"
          type="submit"
          disabled={sending || !newMessage.trim() || !!(error && error.includes('not a member'))}
          style={{ padding: '12px 20px', borderRadius: '14px', whiteSpace: 'nowrap' }}
        >
          {sending ? 'Sending...' : 'Send ➔'}
        </button>
      </form>
    </div>
  )
}

export default ChatTab
