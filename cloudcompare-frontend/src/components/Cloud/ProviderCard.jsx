import { serviceUrl } from '../../utils/report.js'

const providerColors = {
  AWS: { bg: 'rgba(255,153,0,0.15)', color: '#FF9900', icon: 'fab fa-aws' },
  GCP: { bg: 'rgba(66,133,244,0.15)', color: '#4285F4', icon: 'fab fa-google' },
  Azure: { bg: 'rgba(0,120,212,0.15)', color: '#0078D4', icon: 'fab fa-microsoft' },
  OCI: { bg: 'rgba(248,0,0,0.15)', color: '#F80000', icon: 'fas fa-cloud' },
  Alibaba: { bg: 'rgba(255,106,0,0.15)', color: '#FF6A00', icon: 'fas fa-server' }
}

function rankBadgeStyle(index) {
  if (index === 0) return { background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.2))', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.5)' }
  if (index === 1) return { background: 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(100,116,139,0.2))', color: '#cbd5e1', border: '1px solid rgba(148,163,184,0.5)' }
  if (index === 2) return { background: 'linear-gradient(135deg, rgba(205,127,50,0.2), rgba(184,115,51,0.2))', color: '#cd7f32', border: '1px solid rgba(205,127,50,0.5)' }
  return { background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }
}

export default function ProviderCard({ service, rank }) {
  const provider = service.platform || service.provider || 'AWS'
  const colors = providerColors[provider] || providerColors.AWS
  const score = Number(service.score ?? service.final_score ?? service.performance_score ?? 0)
  const cost = Number(service.cost ?? service.cost_per_month ?? service.estimated_monthly_cost ?? (service.price_per_hour * 730) ?? 0)
  const perf = service.performanceLevel || (score >= 7.5 ? 'High' : score >= 5 ? 'Medium' : 'Low')
  const url = serviceUrl(provider, service.service_name)

  return (
    <div className="recommendation-card animate-fade-in-up">
      <div className="recommendation-badge" style={rankBadgeStyle(rank - 1)}>
        <i className={colors.icon} />
        <span>#{rank} Recommendation</span>
      </div>

      <div className="recommendation-content">
        <div className="recommendation-platform">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: colors.bg, color: colors.color }}>
            <i className={colors.icon} />
          </div>
          <h3>{provider} · {service.service_name}</h3>
        </div>

        <div className="recommendation-stats">
          <div className="stat-item">
            <span className="stat-label">Est. Cost</span>
            <span className="stat-value cost" style={{ fontSize: '1.25rem' }}>${cost.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Performance</span>
            <span className="stat-value performance" style={{ fontSize: '1.25rem', color: colors.color }}>{perf}</span>
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
          {service.storage && (
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              <i className="fas fa-hdd mr-1" />{service.storage} GB
            </span>
          )}
          {service.region && (
            <span className="text-xs px-2 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              <i className="fas fa-globe mr-1" />{service.region}
            </span>
          )}
        </div>

        {service.description && (
          <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{service.description}</p>
        )}

        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="visit-service-btn" style={{ borderColor: colors.color, color: colors.color }}>
            <i className="fas fa-external-link-alt" /> Visit Service
          </a>
        )}
      </div>
    </div>
  )
}
