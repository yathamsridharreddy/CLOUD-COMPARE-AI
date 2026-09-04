import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <header className="relative z-10 flex items-center justify-between gap-4 px-4 sm:px-8 py-3 bg-[rgba(13,17,23,0.85)] border-b border-[rgba(0,212,170,0.12)] backdrop-blur-xl">
      <Link
        to={isAuthenticated ? '/dashboard' : '/'}
        className="flex items-center gap-2.5 no-underline text-white font-bold text-lg whitespace-nowrap"
      >
        <i className="fas fa-cloud text-xl bg-gradient-to-r from-[#00d4aa] to-[#7c3aed] bg-clip-text text-transparent" />
        CloudCompare AI
      </Link>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <span className="hidden sm:inline text-[#94a3b8] text-sm">
              <i className="fas fa-user-circle mr-1" />
              {user?.name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-[10px] cursor-pointer bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5] text-sm font-semibold transition hover:bg-[rgba(239,68,68,0.2)] whitespace-nowrap"
            >
              <i className="fas fa-sign-out-alt mr-1.5" />Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline !px-5 !py-2 !text-sm">Login</Link>
            <Link to="/signup" className="btn btn-primary !px-5 !py-2 !text-sm">Signup</Link>
          </>
        )}
      </div>
    </header>
  )
}
