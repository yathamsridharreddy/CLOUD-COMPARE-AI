import { useState } from 'react'
import Header from '../components/Layout/Header.jsx'
import CategorySelector from '../components/Cloud/CategorySelector.jsx'
import ResourceInputs from '../components/Cloud/ResourceInputs.jsx'
import ServiceTypeSelect from '../components/Cloud/ServiceTypeSelect.jsx'
import ProviderCard from '../components/Cloud/ProviderCard.jsx'
import ComparisonCharts from '../components/Cloud/ComparisonCharts.jsx'
import NlpQueryInput from '../components/AI/NlpQueryInput.jsx'
import AiResultsGrid from '../components/AI/AiResultsGrid.jsx'
import ChatbotPanel from '../components/Chatbot/ChatbotPanel.jsx'
import { useCompare } from '../hooks/useCompare.js'
import { aiApi } from '../api/client.js'

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('cloud')

  const [category, setCategory] = useState('compute')
  const [serviceType, setServiceType] = useState('all')
  const [priority, setPriority] = useState('balanced')
  const [resources, setResources] = useState({ cpu: 2, ram: 4, storage: 100, hours: 730 })
  const { results: cloudResults, loading: cloudLoading, error: cloudError, compare } = useCompare()

  const [aiResults, setAiResults] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [lastQuery, setLastQuery] = useState('')

  const handleCompare = () => {
    compare({
      category,
      serviceType,
      priority,
      cpu: resources.cpu,
      ram: resources.ram,
      storage: resources.storage,
      hours: resources.hours,
      region: 'all'
    })
  }

  const handleNlpQuery = async (query) => {
    setAiLoading(true)
    setAiError(null)
    setLastQuery(query)
    try {
      let res
      try {
        res = await aiApi.nlpCompare(query)
      } catch {
        res = await aiApi.compareTools(query)
      }
      const payload = res.data?.data || res.data || null
      setAiResults(payload)
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI analysis failed')
    } finally {
      setAiLoading(false)
    }
  }

  const servicesList = cloudResults?.services || (Array.isArray(cloudResults) ? cloudResults : [])

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

              <CategorySelector selected={category} onChange={(c) => { setCategory(c); setServiceType('all') }} />

              <ResourceInputs values={resources} onChange={setResources} />

              <div className="input-row">
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
            </section>

            {cloudError && (
              <div className="empty-state" style={{ marginBottom: '1.5rem' }}>
                <div className="empty-icon"><i className="fas fa-exclamation-triangle" /></div>
                <h3>Couldn't load results</h3>
                <p>{cloudError}</p>
              </div>
            )}

            {cloudResults && (
              <section className="results-section">
                {cloudResults.recommendation && (
                  <div className="executive-summary-card premium-card" style={{ marginBottom: '1.5rem' }}>
                    <div className="summary-header">
                      <div className="summary-title">
                        <i className="fas fa-star" />
                        <span>Top Recommendation</span>
                      </div>
                    </div>
                    <div className="summary-content">{cloudResults.recommendation}</div>
                  </div>
                )}

                <div className="recommendations-grid">
                  {servicesList.map((svc, i) => (
                    <ProviderCard key={svc.provider || i} service={svc} rank={i + 1} />
                  ))}
                </div>

                <ComparisonCharts services={servicesList} />
              </section>
            )}

            {!cloudResults && !cloudError && (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-server" /></div>
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
                <p>Ask in plain English — our NLP engine will find the best AI tools for your needs</p>
              </div>
              <NlpQueryInput onSubmit={handleNlpQuery} loading={aiLoading} />
            </section>

            {aiError && (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-exclamation-triangle" /></div>
                <h3>Couldn't load results</h3>
                <p>{aiError}</p>
              </div>
            )}

            {aiResults && <AiResultsGrid results={aiResults} query={lastQuery} />}
            {!aiResults && !aiError && (
              <div className="empty-state">
                <div className="empty-icon"><i className="fas fa-robot" /></div>
                <h3>Ready to Compare AI</h3>
                <p>Enter a query above to find the best AI models for your needs.</p>
              </div>
            )}
          </div>
        )}

        {/* Chatbots — always visible, mirroring legacy */}
        <ChatbotPanel
          activeView={activeView}
          cloudContext={{
            category,
            serviceType,
            priority,
            resources,
            services: servicesList
          }}
          aiToolsContext={{
            query: lastQuery,
            tools: aiResults?.tools || []
          }}
        />
      </main>
    </div>
  )
}
