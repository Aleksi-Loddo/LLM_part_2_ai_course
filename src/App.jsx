import { useState, useEffect } from 'react'
import MessageList from './components/MessageList'
import UsageBar from './components/UsageBar'

const API_BASE = 'http://localhost:8000'
const SESSION_ID = `grimoire-${Math.random().toString(36).slice(2, 9)}`

const INGREDIENTS = [
  "Void Salt", "Crow Heart", "Liquid Moonlight", 
  "Graveyard Dust", "Echo of a Scream", "Abyssal Ink", 
  "Shattered Mirror", "Dried Omen-Eyes"
]

export default function App() {
  const [messages, setMessages] = useState([])
  const [isBrewing, setIsBrewing] = useState(false)
  const [sanity, setSanity] = useState(100)
  const [selected, setSelected] = useState([])
  const [lastUsage, setLastUsage] = useState(null)
  const [error, setError] = useState(null)

  // Toggle selection of ingredients
  const toggleIngredient = (ing) => {
    if (selected.includes(ing)) {
      setSelected(selected.filter(i => i !== ing))
    } else if (selected.length < 2) {
      setSelected([...selected, ing])
    }
  }

  async function handleBrew() {
    if (selected.length !== 2 || isBrewing) return

    setError(null)
    const brewText = `Attempting ritual with ${selected[0]} and ${selected[1]}...`
    const userMsg = { role: 'user', content: brewText }
    const updatedMessages = [...messages, userMsg]
    
    setMessages(updatedMessages)
    setIsBrewing(true)

    try {
      await streamBrew(selected, sanity, messages, updatedMessages)
      // Level 2 Flex: Decrease sanity after every brew
      setSanity(prev => Math.max(0, prev - 12))
      setSelected([]) // Reset selection
    } catch (err) {
      setError(err.message)
    } finally {
      setIsBrewing(false)
    }
  }

  async function streamBrew(ingredients, currentSanity, history, updatedMessages) {
    const response = await fetch(`${API_BASE}/brew/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ingredients, 
        sanity: currentSanity, 
        history, 
        session_id: SESSION_ID 
      }),
    })

    if (!response.ok) throw new Error("The Grimoire resists your touch.")

    const assistantIndex = updatedMessages.length
    setMessages([...updatedMessages, { role: 'assistant', content: 'The ink begins to crawl...' }])

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop()

      for (const event of events) {
        if (!event.startsWith('data: ')) continue
        const data = JSON.parse(event.slice(6))

        if (data.type === 'text') {
          fullText += data.content
          setMessages((prev) => {
            const updated = [...prev]
            updated[assistantIndex] = { role: 'assistant', content: fullText }
            return updated
          })
        } else if (data.type === 'done') {
          setLastUsage(data.usage)
        }
      }
    }
  }

  return (
    <div className={`app sanity-${Math.floor(sanity / 10) * 10}`}>
      <header className="header">
        <div className="header-title">
          <h1 className="eldritch-font">Sentient Eldritch Grimoire</h1>
          <div className="sanity-container">
            <label>Sanity: {sanity}%</label>
            <div className="sanity-bar-bg">
              <div className="sanity-bar-fill" style={{ width: `${sanity}%` }}></div>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="btn-clear">Burn Pages</button>
      </header>

      <div className="ritual-area">
        <h3>Select Two Ingredients</h3>
        <div className="ingredient-grid">
          {INGREDIENTS.map(ing => (
            <button 
              key={ing}
              className={`ing-btn ${selected.includes(ing) ? 'active' : ''}`}
              onClick={() => toggleIngredient(ing)}
              disabled={isBrewing}
            >
              {ing}
            </button>
          ))}
        </div>
        <button 
          className="btn-brew" 
          onClick={handleBrew} 
          disabled={selected.length !== 2 || isBrewing}
        >
          {isBrewing ? "BREWING..." : "BEGIN RITUAL"}
        </button>
      </div>

      {lastUsage && <UsageBar usage={lastUsage} />}
      {error && <div className="error-banner">{error}</div>}

      <MessageList messages={messages} isStreaming={isBrewing} />
    </div>
  )
}