import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/client'
import { useAuth } from '../../hooks/useAuth'

/* ─── Exact replica of login.html ─── */

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [emailValidation, setEmailValidation] = useState(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const cardRef = useRef(null)
  const lightRef = useRef(null)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

  // Particle system
  useEffect(() => {
    const bg = document.createElement('div')
    bg.className = 'particle-bg'
    document.body.appendChild(bg)
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div')
      p.className = 'particle'
      const size = Math.random() * 4 + 2
      p.style.width = `${size}px`
      p.style.height = `${size}px`
      p.style.left = `${Math.random() * 100}%`
      p.style.animationDuration = `${Math.random() * 10 + 10}s`
      p.style.animationDelay = `${Math.random() * 10}s`
      p.style.opacity = String(Math.random() * 0.5)
      bg.appendChild(p)
    }
    return () => bg.remove()
  }, [])

  // Light follow + card tilt
  useEffect(() => {
    const handleMove = (e) => {
      if (lightRef.current) {
        lightRef.current.style.left = `${e.clientX}px`
        lightRef.current.style.top = `${e.clientY}px`
      }
      if (cardRef.current) {
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25
        cardRef.current.style.transform = `perspective(1200px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`
      }
    }
    document.addEventListener('mousemove', handleMove)
    return () => document.removeEventListener('mousemove', handleMove)
  }, [])

  const validateEmail = () => {
    if (!email) { setEmailValidation(null); return true }
    if (!emailRegex.test(email)) {
      setEmailValidation({ type: 'error', msg: 'Invalid email format' })
      return false
    }
    setEmailValidation({ type: 'success', msg: 'Valid email' })
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateEmail()) return
    setError('')
    setLoading(true)

    try {
      const res = await authApi.login(email, password)
      const data = res.data
      if (data?.data?.token || data?.token) {
        login(data?.data?.token || data.token)
        navigate('/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="stars" />
      <div className="light-follow" ref={lightRef} />

      {/* Auth Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1.25rem 2.5rem', position: 'relative', zIndex: 20
      }}>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontWeight: 700, fontSize: '1.2rem', color: '#fff', textDecoration: 'none'
        }}>
          <i className="fas fa-cloud" style={{
            fontSize: '1.3rem',
            background: 'linear-gradient(135deg, #00d4aa, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }} />
          CloudCompare AI
        </Link>
      </nav>

      {/* Auth Container */}
      <div style={{
        minHeight: 'calc(100vh - 70px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 10, perspective: 1500
      }}>
        <div className="auth-card" ref={cardRef}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              fontSize: '3rem', marginBottom: '1rem', display: 'inline-block',
              background: 'linear-gradient(135deg, #00d4aa, #7c3aed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 15px rgba(0,212,170,0.4))',
              animation: 'float 4s ease-in-out infinite'
            }}>
              <i className="fas fa-cloud" />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>Welcome Back</h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Log in to access your dashboard</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              padding: '1rem', borderRadius: 12, marginBottom: '2rem', fontSize: '0.95rem',
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block', marginBottom: '0.6rem', color: '#94a3b8',
                fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1
              }}>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateEmail}
                placeholder="you@example.com"
                required
              />
              {emailValidation && (
                <div style={{
                  fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  color: emailValidation.type === 'error' ? '#fca5a5' : '#86efac'
                }}>
                  <i className={`fas ${emailValidation.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`} />
                  {emailValidation.msg}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block', marginBottom: '0.6rem', color: '#94a3b8',
                fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1
              }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingRight: '3.2rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <i
                  className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                    cursor: 'pointer', color: '#64748b', fontSize: '1.1rem', transition: 'all 0.3s', zIndex: 2
                  }}
                />
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? (
                <><i className="fas fa-spinner fa-spin" /> Signing in...</>
              ) : (
                <><i className="fas fa-sign-in-alt" /> Sign In</>
              )}
            </button>
          </form>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{
              color: '#00d4aa', textDecoration: 'none', fontWeight: 800, transition: '0.3s'
            }}>Sign up</Link>
          </div>
        </div>
      </div>
    </>
  )
}
