import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import ConnectionBadge from './ConnectionBadge'

export type OutletContextType = {
  showNotif: (msg: string, type?: 'success' | 'danger' | 'warning') => void
}

export default function MainLayout() {
  const { profile, signOut } = useAuthStore()
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
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Subscribe to telemetry for heartbeat
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
          className={`glass-card notification-banner badge-${notification.type === 'success' ? 'online' : notification.type === 'danger' ? 'offline' : 'warning'}`}
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--color-text)' }}
        >
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <img src="/logo.png" alt="Logo" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          <span>Green Urban Robot</span>
          {profile?.role === 'admin' && (
            <span className="badge" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '1px solid rgba(0,229,176,0.3)', marginLeft: 8 }}>
              ADMIN
            </span>
          )}
        </div>
        <div className="header-actions">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '0.05em' }}>
            {currentTime.toLocaleTimeString('vi-VN')}
          </span>
          <ConnectionBadge lastHeartbeat={lastHeartbeat} />
          
          {/* Theme Toggle Button */}
          <button 
            className="btn btn-ghost" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            style={{ padding: '6px', fontSize: '1rem', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button id="btn-signout" className="btn btn-ghost" onClick={signOut} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        <div className="container" style={{ paddingBottom: '80px' }}>
          <Outlet context={{ showNotif } satisfies OutletContextType} />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-container glass-card">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🤖</span>
            <span className="nav-label">Điều khiển</span>
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
