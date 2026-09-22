import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import AiToolCard from './AiToolCard.jsx'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const chartColors = ['rgba(0,212,170,0.6)', 'rgba(124,58,237,0.6)', 'rgba(59,130,246,0.6)', 'rgba(251,191,36,0.6)', 'rgba(16,185,129,0.6)']

export default function AiResultsGrid({ results, query }) {
  if (!results || !results.tools || results.tools.length === 0) return null

  const tools = results.tools
  const ratingData = {
    labels: tools.map((t) => t.tool_name || t.toolName),
    datasets: [{
      label: 'Rating (out of 10)',
      data: tools.map((t) => Number(t.score ?? 0)),
      backgroundColor: chartColors.slice(0, tools.length),
      borderColor: chartColors.slice(0, tools.length).map((c) => c.replace('0.6', '1')),
      borderWidth: 1,
      borderRadius: 4
    }]
  }
  const ratingOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` Rating: ${ctx.raw.toFixed(1)}/10` } } },
    scales: { x: { beginAtZero: true, max: 10, grid: { color: 'rgba(0,212,170,0.06)' }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#94a3b8' } } }
  }

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
          Found <strong style={{ color: '#fbbf24' }}>{results.totalResults || tools.length}</strong> tools for:{" "}
          <em style={{ color: '#22c55e' }}>"{results.purpose || results.originalQuery || query}"</em>
          {(results.classifiedIntent || results.intent) && (
            <div className="mt-1 text-xs" style={{ color: '#64748b' }}>
              <i className="fas fa-tag mr-1" />Classified as: <span>{results.classifiedIntent || results.intent}</span>
            </div>
          )}
        </div>
      </div>

      <div className="recommendations-grid">
        {tools.map((tool, i) => (
          <AiToolCard key={tool.tool_name || tool.toolName || i} tool={tool} index={i} />
        ))}
      </div>

      <div className="charts-grid" style={{ marginTop: '2rem' }}>
        <div className="chart-card premium-card" style={{ gridColumn: '1 / -1' }}>
          <h3><i className="fas fa-chart-bar" /> AI Tools Rating Comparison</h3>
          <div className="chart-container" style={{ position: 'relative', height: '300px', width: '100%' }}>
            <Bar data={ratingData} options={ratingOptions} />
          </div>
        </div>
      </div>
    </section>
  )
}
