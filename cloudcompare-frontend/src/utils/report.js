// Client-side report helpers (PDF / CSV), mirroring Render's
// src/main/resources/static/script.js exportToPDF()/exportToCSV().
// pdf is loaded via <script> from html2pdf; we import jsPDF only if present.

function serviceUrlMap(platform) {
  const map = {
    AWS: 'https://aws.amazon.com/',
    GCP: 'https://cloud.google.com/',
    Azure: 'https://azure.microsoft.com/',
    OCI: 'https://www.oracle.com/cloud/',
    Alibaba: 'https://www.alibabacloud.com/'
  }
  return map[platform] || 'https://www.google.com/search?q=' + encodeURIComponent(platform + ' cloud')
}

export function serviceUrl(platform, serviceName) {
  return serviceUrlMap(platform)
}

export function exportToCSV(services) {
  const header = 'Platform,Service,Cost,Performance,Score\n'
  const rows = services
    .map((s) => `${s.platform},${s.service_name},${Number(s.cost ?? s.cost_per_month ?? 0)},${Number(s.performance_score ?? 0)},${Number(s.score ?? 0)}`)
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', 'CloudCompare_Architect_Report.csv')
  a.click()
  window.URL.revokeObjectURL(url)
}

export function exportToPDF(services, categoryLabel) {
  if (typeof window.html2pdf === 'undefined') {
    alert('PDF library is still loading. Please try again in a moment.')
    return
  }

  const title = categoryLabel ? `${categoryLabel} Comparison Report` : 'CloudCompare Architect Report'
  const cols = ['Rank', 'Platform', 'Service', 'CPU', 'RAM', 'Storage', 'Cost/Mo', 'Perf', 'Score']
  const rows = services
    .map((s, i) => [i + 1, s.platform, s.service_name, s.cpu, s.ram, s.storage, '$' + Number(s.cost ?? s.cost_per_month ?? 0).toFixed(2), s.performance_score, Number(s.score ?? 0).toFixed(1)])
    .map((r) => r.map((c) => `&nbsp;${c}`).join('</td><td>'))

  const el = document.createElement('div')
  el.style.cssText = 'background:#0f172a;color:#e2e8f0;font-family:Inter,sans-serif;padding:24px;width:100%'
  el.innerHTML = `
    <h2 style="color:#fbbf24;margin:0 0 4px">${title}</h2>
    <p style="color:#94a3b8;margin:0 0 16px">Generated ${new Date().toLocaleString()}</p>
    <table style="border-collapse:collapse;width:100%;font-size:11px">
      <thead>
        <tr>${cols.map((c) => `<th style="border:1px solid #1e293b;background:#0b1120;padding:6px;text-align:left;color:#94a3b8">${c}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map((r) => `<tr>${r}</tr>`).join('')}
      </tbody>
    </table>`

  const opt = {
    margin: 10,
    filename: `CloudCompare_Architect_Report_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  }

  window.html2pdf().set(opt).from(el).save()
}
