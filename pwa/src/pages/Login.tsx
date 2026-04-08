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
    
    // Tự động gán phần đuôi .local nếu người dùng chỉ nhập username (ví dụ: robot001)
    const loginEmail = email.includes('@') ? email : `${email}@local.app`
    
    const err = await signIn(loginEmail, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="organic-card login-card" style={{ padding: 'var(--space-8)' }}>
        <div className="login-logo" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="login-logo-icon" style={{ background: 'var(--color-muted)', width: 80, height: 80, padding: 4 }}>
            <img
              src="/logo.png"
              alt="Green Urban Robot Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <h1 style={{ color: 'var(--color-fg)', fontSize: '2rem' }}>Green Urban Robot</h1>
            <p style={{ color: 'var(--color-muted-fg)', marginTop: '0.5rem' }}>Hệ thống robot đô thị xanh</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
          {error && <div className="error-message">⚠️ {error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ color: 'var(--color-fg)', fontWeight: 700 }}>Tài khoản</label>
            <input
              id="email"
              type="text"
              className="input"
              placeholder="VD: robot001"
              value={email}
              onChange={e => setEmail(e.target.value.toLowerCase())}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password" style={{ color: 'var(--color-fg)', fontWeight: 700 }}>Mật khẩu</label>
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
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', height: 48 }}
          >
            {loading ? (
              <><span className="loader-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /> Đang xử lý...</>
            ) : '🔑 Đăng nhập'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.8rem', color: 'var(--color-muted-fg)', opacity: 0.8 }}>
          Green Urban Robot © 2025 — FPT Semiconductor
        </p>
      </div>
    </div>
  )
}
