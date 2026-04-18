import { useEffect, useRef } from 'react'
export default function MessageList({ messages, isStreaming }) {
  const messagesEndRef = useRef(null)

  // This effect fires every time messages change or streaming status flips
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  if (messages.length === 0) {
    return (
      <div className="messages empty">
        <p className="empty-hint eldritch-font">
          The pages are blank. Combine the forbidden ingredients above to begin your descent into madness.
        </p>
      </div>
    )
  }

  return (
    <div className="messages-container">
      <div className="messages-scroll-area">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-label">
              {msg.role === 'user' ? '◈ Acolyte' : '📖 The Grimoire'}
            </div>
            <div className="message-content">
              {msg.content || <span className="thinking">The ink is crawling across the page...</span>}
              {isStreaming && i === messages.length - 1 && <span className="cursor" />}
            </div>
          </div>
        ))}
        {/* Invisible element that we scroll into view */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}