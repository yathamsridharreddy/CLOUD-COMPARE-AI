const categories = [
  { key: 'compute', icon: 'fa-microchip', label: 'Compute' },
  { key: 'storage', icon: 'fa-database', label: 'Storage' },
  { key: 'database', icon: 'fa-server', label: 'Database' },
  { key: 'ai', icon: 'fa-brain', label: 'AI Services' }
]

export default function CategorySelector({ selected, onChange }) {
  return (
    <div className="input-group category-select">
      <label><i className="fas fa-tags" /> Service Category</label>
      <div className="category-buttons">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`category-btn ${selected === cat.key ? 'active' : ''}`}
            onClick={() => onChange(cat.key)}
          >
            <i className={`fas ${cat.icon}`} />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
