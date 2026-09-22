import { useState } from 'react'

const suggestions = [
  'Best AI for coding and software development',
  'Top tools for content writing and copywriting',
  'AI tools for data analysis and spreadsheets',
  'Image generation and graphic design tools',
  'Video editing and creation AI tools',
  'AI presentation and slide builders',
  'Music and audio generation tools',
  'Research and general-purpose AI assistants'
]

export default function NlpQueryInput({ onSubmit, loading }) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) onSubmit(query.trim())
  }

  const handleSuggestionClick = (s) => {
    setQuery(s)
    setShowSuggestions(false)
    onSubmit(s)
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <i className="fas fa-brain" style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #00d4aa, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }} />
          <input
            type="text" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Ask anything... e.g., 'What's the best AI for building a chatbot?'"
            style={{
              width: '100%', paddingLeft: 48, paddingRight: 130, paddingTop: 16, paddingBottom: 16,
              borderRadius: 16, background: 'rgba(6,11,30,0.8)',
              border: '2px solid rgba(0,212,170,0.15)', color: 'white', fontSize: '0.95rem',
              fontFamily: 'inherit', transition: 'all 0.3s', outline: 'none', boxSizing: 'border-box'
            }}
            onFocusCapture={(e) => { e.target.style.borderColor = '#00d4aa' }}
            onBlurCapture={(e) => { e.target.style.borderColor = 'rgba(0,212,170,0.15)' }}
          />
          <button type="submit" disabled={loading || !query.trim()} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            padding: '0.5rem 1.2rem', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #00d4aa, #00b894)', color: '#060b1e',
            fontWeight: 800, fontSize: '0.85rem', transition: 'all 0.3s',
            opacity: (!query.trim() || loading) ? 0.5 : 1
          }}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Analyzing...</> : <><i className="fas fa-rocket" /> Ask AI</>}
          </button>
        </div>

        {showSuggestions && (
          <div style={{
            position: 'absolute', zIndex: 20, width: '100%', marginTop: 8,
            padding: '0.5rem 0', borderRadius: 16,
            background: 'rgba(13,17,30,0.98)', border: '1px solid rgba(0,212,170,0.15)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)'
          }}>
            <p style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5 }}>Suggestions</p>
            {suggestions.map((s, i) => (
              <button key={i} type="button" onMouseDown={() => handleSuggestionClick(s)}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.9rem',
                  color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(0,212,170,0.08)'; e.target.style.color = '#00d4aa' }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#94a3b8' }}
              >
                <i className="fas fa-lightbulb" style={{ marginRight: 8, color: '#7c3aed' }} />{s}
              </button>
            ))}
          </div>
        )}
      </form>
      <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        <i className="fas fa-magic" style={{ marginRight: 4 }} />
        Powered by NLP — type any question and our AI will find the best tools for you
      </p>
    </div>
  )
}
