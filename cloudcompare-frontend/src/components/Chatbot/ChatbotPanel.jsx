import { useMemo, useState, useRef, useEffect } from 'react'
import { chatApi } from '../../api/client.js'

const starterPrompts = {
  cloud: [
    'Create a beginner deployment plan for this cloud setup',
    'Explain why the top cloud provider is best for my workload',
    'What should I check before deploying this architecture?'
  ],
  ai: [
    'Which AI tool should I choose for this use case?',
    'Explain the trade-offs between the top AI tools',
    'How should a team test these AI tools before adopting one?'
  ]
}

export default function ChatbotPanel({ activeView, cloudContext, aiToolsContext }) {
  const [mode, setMode] = useState(activeView === 'ai' ? 'ai' : 'cloud')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ask for deployment planning, provider trade-offs, AI tool selection, or next-step guidance based on your current results.'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const prompts = useMemo(() => starterPrompts[mode], [mode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendQuestion = async (text = question) => {
    const cleanQuestion = text.trim()
    if (!cleanQuestion || loading) return

    setQuestion('')
    setError(null)
    setLoading(true)
    setMessages((current) => [...current, { role: 'user', text: cleanQuestion }])

    try {
      const res = mode === 'cloud'
        ? await chatApi.cloud(cleanQuestion, cloudContext)
        : await chatApi.aiTools(cleanQuestion, aiToolsContext)

      const reply =
        res.data?.data?.response ||
        res.data?.data?.reply    ||
        res.data?.response       ||
        res.data?.reply          ||
        'I could not generate a response for that question.'

      setMessages((current) => [...current, { role: 'assistant', text: reply }])
    } catch (err) {
      const message = err.response?.status === 403
        ? 'Please log in again to use the chatbot assistant.'
        : err.response?.data?.message || 'Chatbot request failed. Please try again.'
      setError(message)
      setMessages((current) => [...current, { role: 'assistant', text: message }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="input-section" style={{ marginTop: '2rem' }}>
      <div className="section-header">
        <h2><i className="fas fa-comments" /> CloudCompare Assistant</h2>
        <p>Get chatbot guidance using your current cloud or AI comparison context.</p>
      </div>

      <div className="input-row" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
        <div className="input-group">
          <label><i className="fas fa-chess-knight" /> Choose Chat Mode</label>
          <div className="category-buttons" style={{ justifyContent: 'flex-start' }}>
            <button
              type="button"
              className={`category-btn ${mode === 'cloud' ? 'active' : ''}`}
              onClick={() => setMode('cloud')}
            >
              <i className="fas fa-cloud" /><span>Cloud Architect</span>
            </button>
            <button
              type="button"
              className={`category-btn ${mode === 'ai' ? 'active' : ''}`}
              onClick={() => setMode('ai')}
            >
              <i className="fas fa-robot" /><span>AI Tools</span>
            </button>
          </div>
        </div>

        <div
          className="chat-window"
          style={{
            display: 'flex', flexDirection: 'column',
            border: '1px solid var(--glass-border)', borderRadius: '14px',
            overflow: 'hidden', background: 'rgba(15,23,42,0.6)'
          }}
        >
          <div className="chat-messages" style={{ height: '220px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-message ${message.role === 'user' ? 'user' : ''}`}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%', whiteSpace: 'pre-line',
                  padding: '0.7rem 1rem', borderRadius: '14px', fontSize: '0.85rem', lineHeight: 1.5,
                  background: message.role === 'user' ? 'rgba(0,210,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color: message.role === 'user' ? '#00d2ff' : '#94a3b8',
                  border: '1px solid var(--glass-border)'
                }}
              >
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="chat-message" style={{ alignSelf: 'flex-start' }}>
                <div className="pulse-loader"><span /><span /><span /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(event) => { event.preventDefault(); sendQuestion() }}
            className="chat-input-row"
            style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--glass-border)', padding: '0.75rem' }}
          >
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={mode === 'cloud' ? 'Ask for a deployment plan or provider recommendation...' : 'Ask which AI tool fits your workflow...'}
              style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '10px', background: 'rgba(15,23,42,0.8)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
            <button type="submit" className="compare-btn" disabled={loading || !question.trim()} style={{ whiteSpace: 'nowrap' }}>
              <i className="fas fa-paper-plane" /> Ask
            </button>
          </form>
        </div>

        <div className="input-group" style={{ marginTop: '0.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontFamily: 'Inter', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Suggested questions
          </label>
          <div className="category-buttons" style={{ justifyContent: 'flex-start', flexDirection: 'column', gap: '0.5rem' }}>
            {prompts.map((prompt) => (
              <button
                type="button"
                key={prompt}
                className="category-btn"
                onClick={() => sendQuestion(prompt)}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <i className="fas fa-lightbulb" /><span>{prompt}</span>
              </button>
            ))}
          </div>
          {error && (
            <div className="empty-state" style={{ marginTop: '0.75rem', padding: '0.75rem' }}>
              <p style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
