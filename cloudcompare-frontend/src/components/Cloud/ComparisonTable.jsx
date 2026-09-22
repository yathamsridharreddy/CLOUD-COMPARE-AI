import { useMemo, useState } from 'react'
import { serviceUrl } from '../../utils/report.js'

const ICONS = { AWS: 'fab fa-aws', GCP: 'fab fa-google', Azure: 'fab fa-microsoft', OCI: 'fas fa-cloud', Alibaba: 'fas fa-server' }
const COLORS = { AWS: '#FF9900', GCP: '#4285F4', Azure: '#0078D4', OCI: '#F80000', Alibaba: '#FF6A00' }

export default function ComparisonTable({ services }) {
  const [sortBy, setSortBy] = useState('score')

  const sorted = useMemo(() => {
    const list = [...services]
    if (sortBy === 'cost') {
      list.sort((a, b) => Number(a.cost ?? a.cost_per_month ?? a.estimated_monthly_cost ?? 0) - Number(b.cost ?? b.cost_per_month ?? b.estimated_monthly_cost ?? 0))
    } else {
      list.sort((a, b) => Number(b.score ?? b.final_score ?? 0) - Number(a.score ?? a.final_score ?? 0))
    }
    return list
  }, [services, sortBy])

  if (!sorted.length) return null

  const perfClass = (lvl) => (lvl === 'High' ? 'perf-high' : lvl === 'Medium' ? 'perf-medium' : 'perf-low')

  return (
    <div className="table-container">
      <div className="table-header">
        <h3><i className="fas fa-list" /> Detailed Comparison</h3>
        <div className="table-actions">
          <button className="filter-btn" onClick={() => setSortBy('score')}><i className="fas fa-undo" /> Clear Sort</button>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="score">Sort by Score</option>
            <option value="cost">Sort by Cost</option>
          </select>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="results-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Platform</th>
              <th>Service</th>
              <th>CPU</th>
              <th>RAM</th>
              <th>Storage</th>
              <th>Cost/Hour</th>
              <th>Cost/Day</th>
              <th>Cost/Week</th>
              <th>Cost/Month</th>
              <th>Performance</th>
              <th>Popularity</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const platform = s.platform || s.provider || 'AWS'
              const rank = s.rank || i + 1
              const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other'
              const color = COLORS[platform] || '#64748b'
              const url = serviceUrl(platform, s.service_name)
              const svc = url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="table-service-link">
                  {s.service_name} <i className="fas fa-external-link-alt" style={{ fontSize: '0.7em', opacity: 0.6 }} />
                </a>
              ) : s.service_name
              return (
                <tr key={`${platform}-${s.service_name}-${i}`}>
                  <td><span className={`rank-badge ${rankClass}`}>#{rank}</span></td>
                  <td>
                    <span className="platform-badge" style={{ background: color }}>
                      <i className={ICONS[platform] || 'fas fa-cloud'} style={{ marginRight: 4 }} />
                      {platform}
                    </span>
                  </td>
                  <td>{svc}</td>
                  <td>{s.cpu ?? '-'}</td>
                  <td>{s.ram ?? '-'}</td>
                  <td>{s.storage ?? '-'}</td>
                  <td><strong>${Number(s.cost_per_hour ?? 0).toFixed(4)}</strong></td>
                  <td><strong>${Number(s.cost_per_day ?? 0).toFixed(2)}</strong></td>
                  <td><strong>${Number(s.cost_per_week ?? 0).toFixed(2)}</strong></td>
                  <td><strong>${Number(s.cost_per_month ?? s.estimated_monthly_cost ?? 0).toFixed(2)}</strong></td>
                  <td><span className={perfClass(s.performanceLevel || (Number(s.performance_score ?? 0) >= 75 ? 'High' : Number(s.performance_score ?? 0) >= 50 ? 'Medium' : 'Low'))}>{s.performanceLevel || (Number(s.performance_score ?? 0) >= 75 ? 'High' : Number(s.performance_score ?? 0) >= 50 ? 'Medium' : 'Low')}</span></td>
                  <td>{(Number(s.popularity_score ?? 5)).toFixed(1)}/10</td>
                  <td><strong>{Number(s.score ?? s.final_score ?? 0).toFixed(1)}</strong></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
