import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/* ─── Dashboard header — mirrors the legacy dashboard.html header ─── */

export default function Header({ services = 0, providers = 0 }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <header className="header">
      <div className="logo">
        <div className="logo-icon">
          <i className="fas fa-cloud" />
        </div>
        <div className="logo-text">
          <h1>CloudCompare AI</h1>
          <span>Multi-Cloud Service Optimization</span>
        </div>
      </div>
      <div className="header-actions">
        <div className="stats-badge">
          <i className="fas fa-server" />
          <span>{services || 5} Service Types</span>
        </div>
        <div className="stats-badge">
          <i className="fas fa-project-diagram" />
          <span>{providers || 5} Providers</span>
        </div>
        {isAuthenticated ? (
          <>
            <span className="hidden sm:inline text-[#94a3b8] text-sm mr-2">
              <i className="fas fa-user-circle mr-1" />
              {user?.name || user?.email}
            </span>
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt" /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="login-link"><i className="fas fa-sign-in-alt" /> Login</Link>
            <Link to="/signup" className="login-link"><i className="fas fa-user-plus" /> Signup</Link>
          </>
        )}
      </div>
    </header>
  )
}
