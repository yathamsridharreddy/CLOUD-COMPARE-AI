import { Link } from 'react-router-dom'

/* ─── Exact replica of the original index.html ─── */

const stats = [
  { icon: 'fa-th-large', color: 'icon-purple', value: '500+', label: 'AI Categories' },
  { icon: 'fa-layer-group', color: 'icon-blue', value: '10K+', label: 'Tool Comparisons' },
  { icon: 'fa-cloud', color: 'icon-green', value: '50+', label: 'Cloud Providers' },
  { icon: 'fa-chart-line', color: 'icon-pink', value: 'Real-Time', label: 'Insights' }
]

const iconColors = {
  'icon-purple': { bg: 'rgba(138,43,226,0.1)', color: '#d8b4fe', border: 'rgba(138,43,226,0.3)' },
  'icon-blue': { bg: 'rgba(0,210,255,0.1)', color: '#93c5fd', border: 'rgba(0,210,255,0.3)' },
  'icon-green': { bg: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  'icon-pink': { bg: 'rgba(236,72,153,0.1)', color: '#f9a8d4', border: 'rgba(236,72,153,0.3)' }
}

export default function LandingPage() {
  return (
    <>
      <div className="stars" />

      {/* ─── Navbar ─── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.5rem 4rem', position: 'relative', zIndex: 10
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          textDecoration: 'none', color: 'white', fontWeight: 700, fontSize: '1.2rem'
        }}>
          <div style={{
            width: 32, height: 32, background: 'linear-gradient(135deg, #00d2ff, #8a2be2)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="fas fa-cloud" style={{ fontSize: '0.9rem', color: 'white' }} />
          </div>
          <span>CloudCompare AI</span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/login" className="btn btn-outline">Login</Link>
          <Link to="/signup" className="btn btn-primary">Signup</Link>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <main style={{
        display: 'flex', justifyContent: 'space-between', padding: '4rem 4rem',
        position: 'relative', minHeight: 'calc(100vh - 200px)'
      }}>
        {/* Left Column */}
        <div style={{
          flex: 1, maxWidth: 600, zIndex: 10,
          display: 'flex', flexDirection: 'column', justifyContent: 'center'
        }}>
          <div style={{
            color: '#8a2be2', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.5rem'
          }}>
            Smart Cloud & AI Discovery Platform
          </div>
          <h1 style={{
            fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1,
            marginBottom: '1.5rem', letterSpacing: '-0.02em'
          }}>
            Compare.<br />
            Analyze.<br />
            <span className="gradient-text">Choose Better.</span>
          </h1>
          <p style={{
            color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.6,
            marginBottom: '2.5rem', maxWidth: 500
          }}>
            Discover and compare leading AI tools, cloud platforms, and modern software solutions in one intelligent platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login" className="btn btn-primary">Start Comparing →</Link>
            <Link to="/dashboard" className="btn btn-hero-outline">Explore AI Tools</Link>
          </div>
        </div>

        {/* Right Column — Orbital Graphics */}
        <div style={{
          flex: 1, position: 'relative', display: 'flex',
          justifyContent: 'center', alignItems: 'center'
        }}>
          {/* Top Badge */}
          <div style={{
            position: 'absolute', top: -20, right: 0,
            background: 'rgba(10,10,25,0.6)', border: '1px solid rgba(138,43,226,0.3)',
            padding: '0.5rem 1rem', borderRadius: 9999, fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', gap: 6,
            backdropFilter: 'blur(10px)', zIndex: 10
          }}>
            <i className="fas fa-star" style={{ color: '#a5f3fc', fontSize: '0.7rem' }} />
            5000+ AI & Cloud Services Compared
          </div>

          {/* Orbital Ring */}
          <div style={{
            position: 'absolute', width: 800, height: 800, borderRadius: '50%',
            border: '2px solid rgba(0,210,255,0.2)',
            boxShadow: 'inset 0 0 50px rgba(138,43,226,0.2), 0 0 100px rgba(0,210,255,0.15)',
            right: -200, top: '50%', transform: 'translateY(-50%)',
            borderTopColor: 'rgba(138,43,226,0.6)', borderRightColor: 'rgba(0,210,255,0.6)',
            zIndex: 1
          }} />

          {/* Floating Logos */}
          <div className="floating-logo" style={{ width: 90, height: 60, top: '10%', left: '10%', animationDelay: '0s' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS" style={{ filter: 'drop-shadow(0 0 10px rgba(255,153,0,0.4))', padding: 12 }} />
          </div>
          <div className="floating-logo" style={{ width: 80, height: 80, top: '20%', right: '10%', animationDelay: '1s' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg" alt="Azure" style={{ padding: 16 }} />
          </div>
          <div className="floating-logo" style={{
            width: 90, height: 90, top: '35%', left: '35%', animationDelay: '2s',
            borderColor: 'rgba(0,210,255,0.4)', boxShadow: '0 0 30px rgba(0,210,255,0.2)'
          }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg" alt="GCP" style={{ padding: 18 }} />
          </div>
          <div className="floating-logo" style={{ width: 85, height: 60, bottom: '35%', right: '-5%', animationDelay: '3s' }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Oracle_Logo.svg" alt="OCI" />
          </div>
          <div className="floating-logo" style={{ width: 100, height: 60, top: '50%', right: '25%', animationDelay: '1.5s' }}>
            <span style={{ color: '#ff6a00', fontWeight: 800, fontSize: '1.1rem', textAlign: 'center' }}>
              Alibaba<br />Cloud
            </span>
          </div>
          <div className="floating-logo" style={{
            width: 80, height: 80, bottom: '25%', left: 0, animationDelay: '3s',
            flexDirection: 'column', gap: 4
          }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white' }}>AI</span>
            <small style={{ fontSize: '0.45rem', letterSpacing: 1, color: '#a1a1aa' }}>ANTHROPIC</small>
          </div>
          <div className="floating-logo" style={{
            width: 80, height: 40, bottom: '15%', left: '30%', animationDelay: '1.5s',
            fontSize: '1rem', fontWeight: 600, color: '#4facfe'
          }}>
            Gemini
          </div>
          <div className="floating-logo" style={{
            width: 80, height: 60, bottom: '20%', right: '25%', animationDelay: '2.5s',
            fontSize: '1.2rem', fontWeight: 'bold', color: '#f97316'
          }}>
            groq
          </div>
        </div>
      </main>

      {/* ─── Stats Bar ─── */}
      <div style={{ padding: '0 4rem 2rem', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'rgba(13,17,30,0.6)', border: '1px solid rgba(138,43,226,0.2)',
          backdropFilter: 'blur(20px)', borderRadius: 20, padding: '2rem',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem'
        }}>
          {stats.map((s) => {
            const c = iconColors[s.color]
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', background: c.bg, color: c.color, border: `1px solid ${c.border}`
                }}>
                  <i className={`fas ${s.icon}`} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.1, marginBottom: 2 }}>{s.value}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
