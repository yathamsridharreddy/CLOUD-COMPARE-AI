import { useState } from 'react'

const PURPOSES = [
  'Coding and Software Development',
  'Content Writing and Copywriting',
  'Data Analysis and Spreadsheets',
  'Image Generation and Design',
  'Video Generation and Editing',
  'Presentation and Slide Deck Creation',
  'Music and Audio Generation',
  'General Research and Chat'
]

export default function AiPurposeInput({ onSubmit, loading }) {
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [queryText, setQueryText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (loading) return
    onSubmit({ purpose, queryText: queryText.trim() })
  }

  return (
    <div className="input-grid">
      <div className="input-row">
        <div className="input-group full-width">
          <label><i className="fas fa-bullseye" /> Select Purpose</label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            style={{ padding: '1rem', fontSize: '1.1rem', width: '100%', borderRadius: '12px', background: 'rgba(15,23,42,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="input-row">
        <div className="input-group" style={{ marginTop: '1rem' }}>
          <label><i className="fas fa-pen-nib" /> Or enter free-text (optional)</label>
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="e.g., Recommend best tools for building a coding assistant"
          />
          <small style={{ display: 'block', color: '#94a3b8', marginTop: '0.35rem' }}>
            If provided, free-text overrides the dropdown purpose.
          </small>
        </div>

        <div className="input-group action-group" style={{ marginTop: '1rem' }}>
          <button className="compare-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Analyzing...</> : <><i className="fas fa-magic" /> Compare AI Tools</>}
          </button>
        </div>
      </div>
    </div>
  )
}
