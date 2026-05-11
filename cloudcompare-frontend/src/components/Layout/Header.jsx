import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/* ─── Dashboard header matching style.css ─── */

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <header style={{
      position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 2rem',
      background: 'rgba(13, 17, 23, 0.85)',
      borderBottom: '1px solid rgba(0, 212, 170, 0.12)',
      backdropFilter: 'blur(20px)'
    }}>
      <Link to={isAuthenticated ? '/dashboard' : '/'} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', color: 'white', fontWeight: 700, fontSize: '1.1rem'
      }}>
        <i className="fas fa-cloud" style={{
          fontSize: '1.3rem',
          background: 'linear-gradient(135deg, #00d4aa, #7c3aed)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }} />
        CloudCompare AI
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {isAuthenticated ? (
          <>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              <i className="fas fa-user-circle" style={{ marginRight: 4 }} />
              {user?.email}
            </span>
            <button onClick={handleLogout} style={{
              padding: '0.5rem 1rem', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.3s'
            }}>
              <i className="fas fa-sign-out-alt" style={{ marginRight: 6 }} />Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>Login</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}>Signup</Link>
          </>
        )}
      </div>
    </header>
  )
}
