const ICONS = { AWS: 'fab fa-aws', GCP: 'fab fa-google', Azure: 'fab fa-microsoft', OCI: 'fas fa-cloud', Alibaba: 'fas fa-server' }

export default function ProviderStatsGrid({ stats, onFilter }) {
  if (!stats || stats.length === 0) return null
  return (
    <div className="provider-stats-container" style={{ marginTop: '2rem' }}>
      <h3><i className="fas fa-server" /> Provider Statistics</h3>
      <div
        className="provider-stats-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}
      >
        {stats.map((stat) => (
          <div
            key={stat.platform}
            className="provider-stat-card"
            title={`Click to filter results for ${stat.platform}`}
            onClick={() => onFilter?.(stat.platform)}
            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <i className={ICONS[stat.platform] || 'fas fa-cloud'} style={{ fontSize: '1.25rem', color: '#d4a017' }} />
              <strong style={{ fontSize: '1.1rem', color: 'white' }}>{stat.platform}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8' }}>Services:</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{stat.count}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8' }}>Avg Cost:</span>
              <span style={{ color: 'white', fontWeight: 500 }}>${Number(stat.avgCost).toFixed(2)}/mo</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: '#94a3b8' }}>Avg Performance:</span>
              <span style={{ color: 'white', fontWeight: 500 }}>{Number(stat.avgPerformance).toFixed(1)}/10</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
