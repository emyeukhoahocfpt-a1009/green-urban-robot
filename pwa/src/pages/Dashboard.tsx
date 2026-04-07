import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import CameraFeed from '../components/CameraFeed'
import SensorHUD from '../components/SensorHUD'
import GpsMap from '../components/GpsMap'
import ConnectionBadge from '../components/ConnectionBadge'
import SchedulePanel from '../components/SchedulePanel'

export default function Dashboard() {
  const { profile, signOut } = useAuthStore()
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'danger' | 'warning' } | null>(null)
  const notifTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showNotif = (msg: string, type: 'success' | 'danger' | 'warning' = 'success') => {
    setNotification({ msg, type })
    if (notifTimeout.current) clearTimeout(notifTimeout.current)
    notifTimeout.current = setTimeout(() => setNotification(null), 4000)
  }

  const sendCommand = async (command: 'go_home' | 'stop' | 'start') => {
    const { error } = await supabase.from('robot_commands').insert({
      user_id: profile?.id,
      command
    })
    if (!error) {
      const labels = { go_home: '🏠 Về nhà', stop: '⛔ Dừng', start: '▶️ Bắt đầu' }
      showNotif(`Đã gửi lệnh: ${labels[command]}`, 'success')
    }
  }

  // Subscribe to telemetry for heartbeat
  useEffect(() => {
    const channel = supabase
      .channel('heartbeat')
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
    <div className="dashboard">
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
      <header className="dashboard-header">
        <div className="header-brand">
          <span>🤖</span>
          <span>Green Urban Robot</span>
          {profile?.role === 'admin' && (
            <span className="badge" style={{ background: 'var(--color-accent-dim)', color: 'var(--color-accent)', border: '1px solid rgba(0,229,176,0.3)', marginLeft: 4 }}>
              ADMIN
            </span>
          )}
        </div>
        <div className="header-actions">
          <ConnectionBadge lastHeartbeat={lastHeartbeat} />
          <button id="btn-signout" className="btn btn-ghost" onClick={signOut} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="dashboard-body">
        {/* Camera Feed */}
        <div className="glass-card panel camera-panel">
          <div className="section-header">
            <span className="section-title">📹 Camera Feed</span>
          </div>
          <CameraFeed streamUrl={profile?.robot_config?.stream_url} />
        </div>

        {/* Sensor HUD */}
        <div className="glass-card panel">
          <div className="section-header">
            <span className="section-title">📊 Cảm biến</span>
          </div>
          <SensorHUD onLowBattery={() => showNotif('⚠️ Pin dưới 20%! Robot cần sạc.', 'warning')} />

          {/* Commands */}
          <div style={{ marginTop: '20px' }}>
            <div className="section-header" style={{ marginBottom: '12px' }}>
              <span className="section-title">🎮 Điều khiển</span>
            </div>
            <div className="command-row">
              <button id="btn-start" className="btn btn-primary" onClick={() => sendCommand('start')}>▶️ Bắt đầu</button>
              <button id="btn-go-home" className="btn btn-ghost" onClick={() => sendCommand('go_home')}>🏠 Về nhà</button>
              <button id="btn-stop" className="btn btn-danger" onClick={() => sendCommand('stop')}>⛔ Dừng</button>
            </div>
          </div>
        </div>

        {/* GPS Map */}
        <div className="glass-card panel panel-full">
          <div className="section-header">
            <span className="section-title">🗺️ Bản đồ GPS</span>
          </div>
          <GpsMap />
        </div>

        {/* Schedule */}
        <div className="glass-card panel panel-full">
          <div className="section-header">
            <span className="section-title">📅 Lịch hoạt động</span>
          </div>
          <SchedulePanel onNotif={showNotif} />
        </div>
      </main>
    </div>
  )
}
