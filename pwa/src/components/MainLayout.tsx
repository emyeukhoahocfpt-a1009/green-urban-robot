import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import ConnectionBadge from './ConnectionBadge'

export type OutletContextType = {
  showNotif: (msg: string, type?: 'success' | 'danger' | 'warning') => void
}

export default function MainLayout() {
  const { profile, signOut } = useAuthStore()
  const location = useLocation()
  const isMap = location.pathname === '/map'

  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'danger' | 'warning' } | null>(null)
  const notifTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showNotif = (msg: string, type: 'success' | 'danger' | 'warning' = 'success') => {
    setNotification({ msg, type })
    if (notifTimeout.current) clearTimeout(notifTimeout.current)
    notifTimeout.current = setTimeout(() => setNotification(null), 4000)
  }

  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  // Subscribe to telemetry heartbeat
  useEffect(() => {
    const channel = supabase
      .channel('heartbeat_layout')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'robot_telemetry'
      }, (payload) => {
        setLastHeartbeat((payload.new as { timestamp: string }).timestamp)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="app-layout">
      {/* Notification */}
      {notification && (
        <div
          className={`notification-banner badge-${notification.type === 'success' ? 'online' : notification.type === 'danger' ? 'offline' : 'warning'}`}
        >
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <img src="/logo.png" alt="Logo" style={{ width: 28, height: 28, borderRadius: 8 }} />
          <span style={{ fontSize: '0.95rem' }}>Green Urban Robot</span>
          {profile?.role === 'admin' && (
            <span className="badge badge-online" style={{ fontSize: '0.6rem' }}>ADMIN</span>
          )}
        </div>

        <div className="header-actions">
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--color-muted-fg)',
            fontWeight: 500
          }}>
            {currentTime.toLocaleTimeString('vi-VN')}
          </span>

          <ConnectionBadge lastHeartbeat={lastHeartbeat} />

          <button
            className="btn btn-ghost"
            onClick={toggleTheme}
            style={{ width: 34, height: 34, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button id="btn-signout" className="btn btn-ghost" onClick={signOut} style={{ fontSize: '0.8rem' }}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`app-main ${isMap ? 'no-padding' : ''}`}>
        <Outlet context={{ showNotif } satisfies OutletContextType} />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-container">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🤖</span>
            <span className="nav-label">Robot</span>
          </NavLink>

          <NavLink to="/drive" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🕹️</span>
            <span className="nav-label">Lái xe</span>
          </NavLink>

          <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🗺️</span>
            <span className="nav-label">Bản đồ</span>
          </NavLink>

          <NavLink to="/schedule" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">📅</span>
            <span className="nav-label">Lịch trình</span>
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
