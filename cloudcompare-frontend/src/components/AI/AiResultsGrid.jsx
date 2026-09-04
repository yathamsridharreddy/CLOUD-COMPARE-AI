import AiToolCard from './AiToolCard.jsx'

export default function AiResultsGrid({ results, query }) {
  if (!results || !results.tools || results.tools.length === 0) return null

  return (
    <section className="results-section animate-fade-in-up">
      <div className="executive-summary-card premium-card" style={{ marginBottom: '1.5rem' }}>
        <div className="summary-header">
          <div className="summary-title">
            <i className="fas fa-robot" />
            <span>AI Analysis Results</span>
          </div>
        </div>
        <div className="summary-content">
          Found <strong style={{ color: '#fbbf24' }}>{results.totalResults || results.tools.length}</strong> tools for:{" "}
          <em style={{ color: '#22c55e' }}>"{results.purpose || results.originalQuery || query}"</em>
          {(results.classifiedIntent || results.intent) && (
            <div className="mt-1 text-xs" style={{ color: '#64748b' }}>
              <i className="fas fa-tag mr-1" />Classified as: <span>{results.classifiedIntent || results.intent}</span>
            </div>
          )}
        </div>
      </div>

      <div className="recommendations-grid">
        {results.tools.map((tool, i) => (
          <AiToolCard key={tool.tool_name || tool.toolName || i} tool={tool} index={i} />
        ))}
      </div>
    </section>
  )
}
