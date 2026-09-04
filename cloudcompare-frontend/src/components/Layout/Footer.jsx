export default function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 CloudCompare AI - Multi-Cloud Service Recommendation System</p>
      <div className="provider-logos">
        <a href="https://aws.amazon.com/" target="_blank" rel="noopener noreferrer" className="provider-badge aws"><i className="fab fa-aws" /> AWS</a>
        <a href="https://cloud.google.com/" target="_blank" rel="noopener noreferrer" className="provider-badge gcp"><i className="fab fa-google" /> GCP</a>
        <a href="https://azure.microsoft.com/" target="_blank" rel="noopener noreferrer" className="provider-badge azure"><i className="fab fa-microsoft" /> Azure</a>
        <a href="https://www.oracle.com/cloud/" target="_blank" rel="noopener noreferrer" className="provider-badge oci"><i className="fas fa-cloud" /> Oracle Cloud</a>
        <a href="https://www.alibabacloud.com/" target="_blank" rel="noopener noreferrer" className="provider-badge alibaba"><i className="fas fa-server" /> Alibaba Cloud</a>
      </div>
    </footer>
  )
}
