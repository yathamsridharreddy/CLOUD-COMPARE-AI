const providerColors = {
  AWS: { bg: 'rgba(255,153,0,0.15)', color: '#FF9900', icon: 'fab fa-aws' },
  GCP: { bg: 'rgba(66,133,244,0.15)', color: '#4285F4', icon: 'fab fa-google' },
  Azure: { bg: 'rgba(0,120,212,0.15)', color: '#0078D4', icon: 'fab fa-microsoft' },
  OCI: { bg: 'rgba(248,0,0,0.15)', color: '#F80000', icon: 'fas fa-cloud' },
  Alibaba: { bg: 'rgba(255,106,0,0.15)', color: '#FF6A00', icon: 'fas fa-server' }
}

export default function ProviderCard({ service, rank }) {
  const provider = service.provider || 'AWS'
  const colors = providerColors[provider] || providerColors.AWS
  const score = service.final_score || service.performance_score || 0
  const cost = service.estimated_monthly_cost || (service.price_per_hour * 730) || 0

  return (
    <div className="recommendation-card animate-fade-in-up">
      <div
        className="recommendation-badge"
        style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.color}` }}
      >
        <i className={colors.icon} />
        <span>#{rank} · {provider}</span>
      </div>

      <div className="recommendation-content">
        <div className="recommendation-platform">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: colors.bg, color: colors.color }}
          >
            <i className={colors.icon} />
          </div>
          <h3>{service.service_name}</h3>
        </div>

        <div className="recommendation-stats">
          <div className="stat-item">
            <span className="stat-label">Performance</span>
            <span className="stat-value performance">{Number(score).toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Monthly Cost</span>
            <span className="stat-value cost">${Number(cost).toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {service.cpu && (
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: colors.bg, color: colors.color }}>
              <i className="fas fa-microchip mr-1" />{service.cpu} vCPU
            </span>
          )}
          {service.ram && (
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(0,210,255,0.1)', color: '#00d2ff' }}>
              <i className="fas fa-memory mr-1" />{service.ram} GB
            </span>
          )}
          {service.region && (
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              <i className="fas fa-globe mr-1" />{service.region}
            </span>
          )}
        </div>

        {service.description && (
          <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
            {service.description}
          </p>
        )}
      </div>
    </div>
  )
}
