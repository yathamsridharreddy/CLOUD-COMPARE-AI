export default function AiToolCard({ tool, index }) {
  const score = Number(tool.score ?? 0)
  const scoreColor = score >= 9 ? '#22c55e' : score >= 8 ? '#fbbf24' : '#3b82f6'
  const toolUrl = tool.url || (tool.tool_name ? `https://www.google.com/search?q=${encodeURIComponent(tool.tool_name + ' AI Tool')}` : null)

  return (
    <div className="recommendation-card animate-fade-in-up">
      <div className="recommendation-badge" style={{ background: 'rgba(138,43,226,0.15)', color: '#a78bfa', border: '1px solid rgba(138,43,226,0.3)' }}>
        <i className="fas fa-trophy" />
        <span>#{tool.rank || index + 1} · {tool.provider || 'AI'}</span>
      </div>

      <div className="recommendation-content">
        <div className="recommendation-platform">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: 'rgba(138,43,226,0.15)', color: '#a78bfa' }}>
            <i className="fas fa-robot" />
          </div>
          <h3>{tool.tool_name || tool.toolName} <span style={{ fontSize: '0.8em', color: '#94a3b8', fontWeight: 'normal' }}>by {tool.provider}</span></h3>
        </div>

        <div className="recommendation-stats">
          <div className="stat-item">
            <span className="stat-label">Model Engine</span>
            <span className="stat-value" style={{ fontSize: '0.95rem', color: '#fff' }}>{tool.model_number || tool.modelNumber || '—'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">AI Score</span>
            <span className="stat-value" style={{ color: scoreColor }}>{score.toFixed(1)}/10</span>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-md" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', alignSelf: 'flex-start' }}>
          <i className="fas fa-tag mr-1" />{tool.pricing || 'Contact'}
        </span>

        {tool.description && (
          <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{tool.description}</p>
        )}

        {toolUrl && (
          <a href={toolUrl} target="_blank" rel="noopener noreferrer" className="visit-service-btn" style={{ borderColor: 'rgba(0,212,170,0.5)', color: '#00d4aa' }}>
            <i className="fas fa-external-link-alt" /> Try Tool
          </a>
        )}
      </div>
    </div>
  )
}
