const PROVIDERS = ['AWS', 'GCP', 'Azure', 'OCI', 'Alibaba']
const ICONS = { AWS: 'fab fa-aws', GCP: 'fab fa-google', Azure: 'fab fa-microsoft', OCI: 'fas fa-cloud', Alibaba: 'fas fa-server' }

export default function ProviderFilterBar({ active, onChange, providers }) {
  const list = providers?.length ? providers : PROVIDERS
  return (
    <div className="provider-filter-bar">
      <span className="filter-label"><i className="fas fa-filter" /> Filter by Provider:</span>
      <div className="provider-filter-chips">
        <button
          className={`provider-chip ${active === 'all' ? 'active' : ''}`}
          data-provider="all"
          onClick={() => onChange('all')}
        >
          <i className="fas fa-th-list" /> All Services
        </button>
        {list.map((p) => (
          <button
            key={p}
            className={`provider-chip ${active === p ? 'active' : ''}`}
            data-provider={p}
            onClick={() => onChange(p)}
          >
            <i className={ICONS[p] || 'fas fa-cloud'} /> {p}
          </button>
        ))}
      </div>
    </div>
  )
}
