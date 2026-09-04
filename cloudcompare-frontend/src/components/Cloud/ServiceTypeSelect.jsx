import { useState, useEffect } from 'react'
import { cloudApi } from '../../api/client'

export default function ServiceTypeSelect({ category, value, onChange }) {
  const [types, setTypes] = useState([])

  useEffect(() => {
    if (!category) return
    cloudApi.getServiceTypes(category)
      .then((res) => setTypes(res.data?.data || []))
      .catch(() => setTypes([]))
  }, [category])

  return (
    <div className="input-group full-width">
      <label><i className="fas fa-filter" /> Specific Service Type</label>
      <div className="premium-select-wrapper">
        <select
          id="service-type-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="premium-select"
        >
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <i className="fas fa-chevron-down select-arrow" />
      </div>
    </div>
  )
}
