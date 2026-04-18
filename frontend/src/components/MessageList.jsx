export default function MessageList({ messages, isStreaming }) {
  if (messages.length === 0) {
    return (
      <div className="messages empty">
        <p className="empty-hint eldritch-font">
          The pages are blank. Combine the forbidden ingredients above or whisper to the book to begin your descent into madness.
        </p>
      </div>
    )
  }

  return (
    <div className="messages">
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`}>
          <div className="message-label">
            {msg.role === 'user' ? '◈ Acolyte' : '📖 The Grimoire'}
          </div>
          <div className="message-content">
            {msg.content || <span className="thinking">The ink is crawling across the page...</span>}
            {/* Show blinking cursor only on the last message while streaming */}
            {isStreaming && i === messages.length - 1 && <span className="cursor" />}
          </div>
        </div>
      ))}
    </div>
  )
}