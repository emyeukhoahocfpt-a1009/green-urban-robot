import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Navigate } from 'react-router-dom'

export default function Login() {
  const { session, signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="glass-card login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🤖</div>
          <div>
            <h1>Green Urban Robot</h1>
            <p>Hệ thống điều khiển robot đô thị xanh</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="robot@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? (
              <><span className="loader-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /> Đang đăng nhập...</>
            ) : '🔑 Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
          Green Urban Robot © 2025 — FPT Semiconductor
        </p>
      </div>
    </div>
  )
}
