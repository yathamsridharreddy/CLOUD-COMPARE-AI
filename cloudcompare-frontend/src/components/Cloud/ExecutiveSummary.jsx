import { useState } from 'react'
import { exportToPDF, exportToCSV } from '../../utils/report.js'

// Generates the "AI Architect's Verdict" text client-side from results,
// matching Render's generateAiSummary() logic.
export function buildVerdict(services) {
  if (!services || services.length === 0) return ''
  const bestCost = services.reduce((min, p) => (Number(p.cost ?? p.cost_per_month ?? 0) < Number(min.cost ?? min.cost_per_month ?? 0) ? p : min), services[0])
  const bestPerf = services.reduce((max, p) => (Number(p.performance_score ?? 0) > Number(max.performance_score ?? 0) ? p : max), services[0])
  const bestCostN = Number(bestCost.cost ?? bestCost.cost_per_month ?? 0)
  const bestPerfN = Number(bestPerf.performance_score ?? 0)

  let verdict = 'Based on my architectural analysis, '
  if (bestCost.platform === bestPerf.platform) {
    verdict += `<strong>${bestCost.platform}</strong> is the clear leader for this workload, offering both the lowest cost ($${bestCostN.toFixed(2)}) and peak performance.`
  } else {
    verdict += `you face a trade-off: <strong>${bestCost.platform}</strong> is the budget leader at $${bestCostN.toFixed(2)}, but <strong>${bestPerf.platform}</strong> delivers superior performance (Score: ${bestPerfN.toFixed(1)}/10).`
  }
  verdict += `<br><br>Recommended Action: Deploy to <strong>${bestPerf.platform}</strong> if uptime and throughput are critical; otherwise, <strong>${bestCost.platform}</strong> provides the optimal ROI.`
  return verdict
}

export default function ExecutiveSummary({ services, categoryLabel, onAskArchitect }) {
  const [verdict, setVerdict] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Lazy-generate the verdict once (mimics the typing indicator).
  if (!verdict && services && services.length) {
    setTimeout(() => {
      setGenerating(true)
      setTimeout(() => {
        setVerdict(buildVerdict(services))
        setGenerating(false)
      }, 600)
    }, 0)
  }

  return (
    <div className="executive-summary-card premium-card" style={{ marginBottom: '2rem' }}>
      <div className="summary-header">
        <div className="summary-title">
          <i className="fas fa-robot" />
          <span>AI Architect&apos;s Verdict</span>
        </div>
        <div className="summary-actions">
          <button className="action-btn" onClick={() => onAskArchitect?.()}>
            <i className="fas fa-comments" /> Ask Architect
          </button>
          <button className="action-btn" onClick={() => exportToPDF(services, categoryLabel)}>
            <i className="fas fa-file-pdf" /> PDF Report
          </button>
          <button className="action-btn" onClick={() => exportToCSV(services)}>
            <i className="fas fa-file-csv" /> CSV
          </button>
        </div>
      </div>
      <div className="summary-content">
        {generating || (!verdict) ? (
          <div className="typing-indicator"><span /><span /><span /></div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: verdict }} />
        )}
      </div>
    </div>
  )
}
