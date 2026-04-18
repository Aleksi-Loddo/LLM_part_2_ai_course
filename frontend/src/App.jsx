import { useState, useEffect } from 'react'
import MessageList from './components/MessageList'
import UsageBar from './components/UsageBar'

const API_BASE = 'http://localhost:8000'
const SESSION_ID = `grimoire-${Math.random().toString(36).slice(2, 9)}`


const INGREDIENTS = [
  { name: "Void Salt", trait: "Corrosive", flavor: "Consumes light and hope." },
  { name: "Crow Heart", trait: "Necrotic", flavor: "Still warm with a rhythm of dread." },
  { name: "Liquid Moonlight", trait: "Ethereal", flavor: "A cold fluid from a sky that never was." },
  { name: "Graveyard Dust", trait: "Inert", flavor: "The quiet remains of forgotten kings." },
  { name: "Echo of a Scream", trait: "Sonic", flavor: "Captured in a crystal that vibrates with fear." },
  { name: "Abyssal Ink", trait: "Fluid", flavor: "Stains the soul deeper than the skin." },
  { name: "Shattered Mirror", trait: "Distorting", flavor: "Reflects things that haven't happened yet." },
  { name: "Dried Omen-Eyes", trait: "Clairvoyant", flavor: "They blink when the future changes." },
  { name: "Amethyst Ichor", trait: "Radiant", flavor: "Purple blood from a subterranean titan." },
  { name: "Yesterday's Ash", trait: "Temporal", flavor: "Warm with the heat of a fire yet to be lit." },
  { name: "Obsidian Tongue", trait: "Linguistic", flavor: "Whispers secrets in a dead language." },
  { name: "Nebula Yarn", trait: "Binding", flavor: "Threads woven from the gravity of stars." },
  { name: "Thistle of Envy", trait: "Toxic", flavor: "Its thorns sting with the pain of rejection." },
  { name: "Frozen Tear", trait: "Crystalline", flavor: "A sorrowful drop turned to indestructible glass." },
  { name: "Petrified Sigh", trait: "Gaseous", flavor: "A heavy vapor trapped in ancient stone." },
  { name: "Moth-Wing Silk", trait: "Fragile", flavor: "Shimmers with the dust of a thousand dreams." }
];

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
    if (selected.length !== 2 || isBrewing) return;

    const brewDescription = `Ritual: Combining ${selected[0].name} and ${selected[1].name}.`;
    const userMsg = { role: 'user', content: brewDescription };
    
    // Capture the state *before* the update to pass to streamBrew
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsBrewing(true);
    setError(null);

    try {
      // Pass the current messages as history
      await streamBrew(selected, sanity, messages, updatedMessages); 
      setSanity(prev => Math.max(0, prev - 15));
      setSelected([]);
    } catch (err) {
      console.error(err);
      setError("The ritual failed. The void is silent.");
    } finally {
      setIsBrewing(false);
    }
  }
 async function streamBrew(ingredients, currentSanity, history, updatedMessages) {
    const response = await fetch(`${API_BASE}/brew/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        
        ingredients: ingredients.map(ing => ing.name), 
        sanity: currentSanity, 
        history: history, 
        session_id: SESSION_ID 
      }),
    })

    if (!response.ok) throw new Error("The Grimoire resists your touch.")

    const assistantIndex = updatedMessages.length;
    
    setMessages([...updatedMessages, { role: 'assistant', content: '' }]);

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
        try {
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
        } catch (e) {
          console.error("JSON Parse Error", e)
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
    key={ing.name}
    title={ing.flavor} // Hover tooltip!
    className={`ing-btn ${selected.includes(ing) ? 'active' : ''}`}
    onClick={() => toggleIngredient(ing)}
  >
    <span className="ing-name">{ing.name}</span>
    <span className="ing-trait">{ing.trait}</span>
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