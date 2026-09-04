import { useState, useEffect } from 'react'
import Header from '../components/Layout/Header.jsx'
import Footer from '../components/Layout/Footer.jsx'
import CategorySelector from '../components/Cloud/CategorySelector.jsx'
import ResourceInputs from '../components/Cloud/ResourceInputs.jsx'
import ServiceTypeSelect from '../components/Cloud/ServiceTypeSelect.jsx'
import ProviderCard from '../components/Cloud/ProviderCard.jsx'
import ProviderFilterBar from '../components/Cloud/ProviderFilterBar.jsx'
import ProviderStatsGrid from '../components/Cloud/ProviderStatsGrid.jsx'
import ComparisonTable from '../components/Cloud/ComparisonTable.jsx'
import ComparisonCharts from '../components/Cloud/ComparisonCharts.jsx'
import ExecutiveSummary from '../components/Cloud/ExecutiveSummary.jsx'
import AiPurposeInput from '../components/AI/AiPurposeInput.jsx'
import AiResultsGrid from '../components/AI/AiResultsGrid.jsx'
import ChatbotPanel from '../components/Chatbot/ChatbotPanel.jsx'
import { useCompare } from '../hooks/useCompare.js'
import { aiApi, cloudApi } from '../api/client.js'

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('cloud')

  const [category, setCategory] = useState('compute')
  const [serviceType, setServiceType] = useState('all')
  const [priority, setPriority] = useState('balanced')
  const [region, setRegion] = useState('all')
  const [regions, setRegions] = useState([])
  const [resources, setResources] = useState({ cpu: 2, ram: 4, storage: 100, hours: 730 })
  const [providerFilter, setProviderFilter] = useState('all')

  const { results: cloudResults, loading: cloudLoading, error: cloudError, compare, clearResults } = useCompare()

  const [aiResults, setAiResults] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')

  const servicesList = cloudResults?.services || (Array.isArray(cloudResults) ? cloudResults : [])
  const filteredServices = providerFilter === 'all'
    ? servicesList
    : servicesList.filter((s) => s.platform === providerFilter)

  // Load regions once
  useEffect(() => {
    cloudApi.getRegions()
      .then((res) => setRegions(res.data?.data || []))
      .catch(() => setRegions([]))
  }, [])

  const handleCompare = () => {
    compare({
      category,
      serviceType,
      priority,
      region,
      cpu: resources.cpu,
      ram: resources.ram,
      storage: resources.storage,
      hours: resources.hours
    })
  }

  const handleAiSubmit = async ({ purpose, queryText }) => {
    setAiLoading(true)
    setAiError(null)
    const effectiveQuery = queryText || purpose
    setLastQuery(effectiveQuery)
    try {
      let res
      try {
        res = await aiApi.compareTools(effectiveQuery)
      } catch {
        res = await aiApi.nlpCompare(effectiveQuery)
      }
      const payload = res.data?.data || res.data || null
      setAiResults(payload)
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI analysis failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAskArchitect = () => {
    // Switch to cloud view and scroll to the chatbot with a prepared question.
    setActiveView('cloud')
    setTimeout(() => {
      const el = document.getElementById('chat-question-input')
      if (el) {
        el.value = 'Using my current comparison results, explain the best deployment choice, the main trade-off, and the next deployment step.'
        el.focus()
      }
      document.getElementById('chatbot-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        {/* View Toggle */}
        <div className="view-toggle-container">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${activeView === 'cloud' ? 'active' : ''}`}
              onClick={() => setActiveView('cloud')}
            >
              <i className="fas fa-server" /> Cloud Services
            </button>
            <button
              className={`toggle-btn ${activeView === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveView('ai')}
            >
              <i className="fas fa-robot" /> AI Tools
            </button>
          </div>
        </div>

        {/* ═══════════ CLOUD VIEW ═══════════ */}
        {activeView === 'cloud' && (
          <div>
            <section className="input-section">
              <div className="section-header">
                <h2><i className="fas fa-sliders-h" /> Configure Your Requirements</h2>
                <p>Select your cloud service needs and we'll find the best option</p>
              </div>

              <div className="input-grid">
                <CategorySelector selected={category} onChange={(c) => { setCategory(c); setServiceType('all') }} />

                <ResourceInputs values={resources} onChange={setResources} />

                <div className="input-row">
                  <div className="input-group">
                    <label><i className="fas fa-globe" /> Region</label>
                    <select id="region" value={region} onChange={(e) => setRegion(e.target.value)}>
                      <option value="all">All Regions</option>
                      {regions.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <ServiceTypeSelect category={category} value={serviceType} onChange={setServiceType} />

                  <div className="input-group">
                    <label><i className="fas fa-sort-amount-up" /> Priority</label>
                    <div className="premium-select-wrapper">
                      <select
                        id="priority-select"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="premium-select"
                      >
                        <option value="balanced">Balanced (Cost + Performance)</option>
                        <option value="cost">Cost Optimization</option>
                        <option value="performance">Maximum Performance</option>
                      </select>
                      <i className="fas fa-chevron-down select-arrow" />
                    </div>
                  </div>

                  <div className="input-group action-group">
                    <button className="compare-btn" id="compare-btn" onClick={handleCompare} disabled={cloudLoading}>
                      {cloudLoading ? (
                        <div className="pulse-loader"><span /><span /><span /></div>
                      ) : (
                        <><i className="fas fa-rocket" /> Compare Services</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {cloudLoading && (
              <div className="loading-state">
                <div className="loader"><i className="fas fa-cloud" /></div>
                <p>Analyzing cloud services...</p>
              </div>
            )}

            {cloudError && (
              <div className="empty-state" style={{ marginBottom: '1.5rem' }}>
                <div className="empty-icon"><i className="fas fa-exclamation-triangle" /></div>
                <h3>Couldn't load results</h3>
                <p>{cloudError}</p>
              </div>
            )}

            {cloudResults && !cloudLoading && (
              <section className="results-section">
                <ExecutiveSummary
                  services={filteredServices}
                  categoryLabel={category}
                  onAskArchitect={handleAskArchitect}
                />

                <ProviderFilterBar active={providerFilter} onChange={setProviderFilter} providers={servicesList.map((s) => s.platform)} />

                <div className="recommendations-grid">
                  {filteredServices.map((svc, i) => (
                    <ProviderCard key={`${svc.platform}-${svc.service_name}-${i}`} service={svc} rank={i + 1} />
                  ))}
                </div>

                <ComparisonCharts services={filteredServices} />

                <ProviderStatsGrid stats={cloudResults.providerStats} onFilter={setProviderFilter} />

                <ComparisonTable services={filteredServices} />
              </section>
            )}

            {!cloudResults && !cloudError && !cloudLoading && (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-cloud-upload-alt" /></div>
                <h3>Ready to Compare</h3>
                <p>Configure your requirements above and click "Compare Services" to find the best cloud service for your needs.</p>
                <div className="features-grid">
                  <div className="feature-item"><i className="fas fa-check-circle" /><span>5 Cloud Providers</span></div>
                  <div className="feature-item"><i className="fas fa-check-circle" /><span>Smart Ranking</span></div>
                  <div className="feature-item"><i className="fas fa-check-circle" /><span>Cost Estimation</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ AI VIEW ═══════════ */}
        {activeView === 'ai' && (
          <div>
            <section className="input-section">
              <div className="section-header">
                <h2><i className="fas fa-brain" /> AI Tool Recommendation</h2>
                <p>Select your purpose and we'll find the best AI tools for the job</p>
              </div>
              <AiPurposeInput onSubmit={handleAiSubmit} loading={aiLoading} />
            </section>

            {aiLoading && (
              <div className="loading-state">
                <div className="loader"><i className="fas fa-robot" /></div>
                <p>Analyzing AI tools...</p>
              </div>
            )}

            {aiError && (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-exclamation-triangle" /></div>
                <h3>Couldn't load results</h3>
                <p>{aiError}</p>
              </div>
            )}

            {aiResults && <AiResultsGrid results={aiResults} query={lastQuery} />}
            {!aiResults && !aiError && !aiLoading && (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-robot" /></div>
                <h3>Ready to Compare AI</h3>
                <p>Select your purpose above and click "Compare AI Tools" to find the best AI models for your needs.</p>
              </div>
            )}
          </div>
        )}

        {/* Chatbots — always visible, mirroring legacy */}
        <div id="chatbot-section" className="input-section" style={{ marginTop: '2rem' }}>
          <div className="section-header">
            <h2><i className="fas fa-comments" /> Chatbots (Cloud vs AI Tools)</h2>
            <p>Ask for deeper reasoning. Both chat modes use your current selections/results.</p>
          </div>
          <ChatbotPanel
            activeView={activeView}
            cloudContext={{
              category,
              serviceType,
              priority,
              region,
              resources,
              services: filteredServices
            }}
            aiToolsContext={{
              query: lastQuery,
              tools: aiResults?.tools || []
            }}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
