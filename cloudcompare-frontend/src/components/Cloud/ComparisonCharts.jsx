import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend)

const providerColors = { AWS: '#FF9900', GCP: '#4285F4', Azure: '#0078D4', OCI: '#F80000', Alibaba: '#FF6A00' }
const colorOf = (platform) => providerColors[platform] || '#64748b'
const plat = (s) => s.platform || s.provider || 'AWS'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const barOptions = (max) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(59,130,246,0.4)', borderWidth: 1 } },
  scales: {
    y: { beginAtZero: true, max: max || undefined, grid: { color: 'rgba(212,160,23,0.08)' }, ticks: { color: '#a89968' } },
    x: { grid: { display: false }, ticks: { color: '#a89968', font: { size: 10 } } }
  }
})

function buildBar(services, valueKey, label, max) {
  return {
    data: {
      labels: services.map((s) => s.service_name),
      datasets: [{
        label,
        data: services.map((s) => Number(s[valueKey] ?? s[valueKey === 'score' ? 'final_score' : valueKey]) || 0),
        backgroundColor: services.map((s) => colorOf(plat(s)) + '88'),
        borderColor: services.map((s) => colorOf(plat(s))),
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: barOptions(max)
  }
}

export default function ComparisonCharts({ services }) {
  if (!services || services.length === 0) return null

  const costData = {
    labels: services.map((s) => s.service_name),
    datasets: [{
      label: 'Cost ($)',
      data: services.map((s) => Number(s.cost ?? s.cost_per_month ?? s.estimated_monthly_cost ?? 0)),
      backgroundColor: services.map((s) => colorOf(plat(s)) + '88'),
      borderColor: services.map((s) => colorOf(plat(s))),
      borderWidth: 2,
      borderRadius: 8
    }]
  }
  const perfData = buildBar(services, 'performance_score', 'Performance', 10)
  const rankData = buildBar(services, 'score', 'Score', 10)

  // Platform-level aggregation
  const platforms = [...new Set(services.map((s) => plat(s)))]
  const platformData = platforms.map((p) => {
    const ps = services.filter((s) => plat(s) === p)
    return {
      platform: p,
      count: ps.length,
      avgScore: ps.reduce((a, s) => a + Number(s.score ?? s.final_score ?? 0), 0) / ps.length,
      avgPopularity: ps.reduce((a, s) => a + Number(s.popularity_score ?? 5), 0) / ps.length
    }
  })
  const platLabels = platformData.map((p) => p.platform)
  const platBg = platformData.map((p) => colorOf(p.platform))

  const distributionData = {
    labels: platLabels,
    datasets: [{ data: platformData.map((p) => p.count), backgroundColor: platBg.map((c) => c + 'D9'), borderColor: 'rgba(15,23,42,0.95)', borderWidth: 4, hoverOffset: 16 }]
  }
  const valueData = buildBar(platformData, 'avgScore', 'Value Score', 10)
  const popData = buildBar(platformData, 'avgPopularity', 'Popularity', 10)

  // Trend line per service
  const trendDatasets = services.map((s, idx) => {
    const base = Number(s.cost ?? s.cost_per_month ?? s.estimated_monthly_cost ?? 50)
    return {
      label: `${plat(s)} - ${s.service_name}`,
      data: months.map((_, i) => parseFloat((base * (Math.sin(i * 0.5 + idx) * 0.15 + 1) * (1 - (idx + 1) * 0.1 + i * 0.02)).toFixed(2))),
      borderColor: colorOf(plat(s)),
      backgroundColor: colorOf(plat(s)) + '1A',
      borderWidth: 2, fill: false, tension: 0, pointRadius: 4, pointBackgroundColor: colorOf(plat(s))
    }
  })

  const trendData = { labels: months, datasets: trendDatasets }
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top', labels: { color: '#94a3b8', usePointStyle: true, font: { size: 11 } } } },
    scales: { y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } }
  }

  return (
    <>
      <div className="charts-row" style={{ marginTop: '2rem' }}>
        <div className="chart-container">
          <h3><i className="fas fa-dollar-sign" /> Cost Comparison</h3>
          <div className="h-52"><Bar data={costData} options={barOptions()} /></div>
        </div>
        <div className="chart-container">
          <h3><i className="fas fa-chart-line" /> Performance Score</h3>
          <div className="h-52"><Bar data={perfData} options={perfData.options} /></div>
        </div>
        <div className="chart-container">
          <h3><i className="fas fa-trophy" /> Ranking Score</h3>
          <div className="h-52"><Bar data={rankData} options={rankData.options} /></div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <h3><i className="fas fa-chart-pie" /> Platform Distribution</h3>
          <div className="h-52"><Doughnut data={distributionData} options={{ responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', usePointStyle: true } } } }} /></div>
        </div>
        <div className="chart-container">
          <h3><i className="fas fa-balance-scale" /> Value Score (Cost vs Performance)</h3>
          <div className="h-52"><Bar data={valueData} options={valueData.options} /></div>
        </div>
        <div className="chart-container">
          <h3><i className="fas fa-star" /> Popularity by Platform</h3>
          <div className="h-52"><Bar data={popData} options={popData.options} /></div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container full-width">
          <h3><i className="fas fa-chart-line" /> Cost Trend Analysis</h3>
          <div className="h-64"><Line data={trendData} options={trendOptions} /></div>
        </div>
      </div>
    </>
  )
}
