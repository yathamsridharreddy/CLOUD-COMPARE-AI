export default function ResourceInputs({ values, onChange }) {
  const fields = [
    { id: 'cpu', icon: 'fa-microchip', label: 'vCPU', placeholder: 'e.g., 2', min: 1, max: 128 },
    { id: 'ram', icon: 'fa-memory', label: 'RAM (GB)', placeholder: 'e.g., 4', min: 1, max: 512 },
    { id: 'storage', icon: 'fa-hdd', label: 'Storage (GB)', placeholder: 'e.g., 100', min: 1, max: 10000 },
    { id: 'hours', icon: 'fa-clock', label: 'Hours/Month', placeholder: 'e.g., 730', min: 1, max: 8760 }
  ]

  const handleChange = (id, val) => {
    onChange({ ...values, [id]: parseInt(val) || 0 })
  }

  return (
    <div className="input-row">
      {fields.map((f) => (
        <div className="input-group" key={f.id}>
          <label><i className={`fas ${f.icon}`} /> {f.label}</label>
          <input
            id={`input-${f.id}`}
            type="number"
            value={values[f.id] || ''}
            onChange={(e) => handleChange(f.id, e.target.value)}
            placeholder={f.placeholder}
            min={f.min}
            max={f.max}
          />
        </div>
      ))}
    </div>
  )
}
