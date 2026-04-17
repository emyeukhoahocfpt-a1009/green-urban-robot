import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import CameraFeed from '../components/CameraFeed'
import SensorHUD from '../components/SensorHUD'
import type { OutletContextType } from '../components/MainLayout'
import {
  Play,
  CircleStop,
  Home as HomeIcon,
  Video,
  Gamepad2,
  BarChart3,
  Link2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

export default function Home() {
  const { profile } = useAuthStore()
  const { showNotif } = useOutletContext<OutletContextType>()

  const [currentRobot, setCurrentRobot] = useState<any>(null)
  const [loadingRobot, setLoadingRobot] = useState(true)
  const [macInput, setMacInput] = useState('')
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (profile) fetchRobot()
  }, [profile])

  const fetchRobot = async () => {
    setLoadingRobot(true)
    const { data } = await supabase
      .from('robots')
      .select('*')
      .eq('owner_id', profile!.id)
      .maybeSingle()
    setCurrentRobot(data)
    setLoadingRobot(false)
  }

  const claimRobot = async () => {
    if (!macInput.trim() || !profile) return
    setClaiming(true)
    const cleanId = macInput.toUpperCase().replace(/[:\s]/g, '')
    try {
      const { error } = await supabase
        .from('robots')
        .update({ owner_id: profile.id, name: 'My Green Robot' })
        .eq('id', cleanId)
      if (error) throw error
      showNotif('✅ Đã kết nối Robot thành công!', 'success')
      setMacInput('')
      fetchRobot()
    } catch (err: any) {
      showNotif('❌ Lỗi: ' + err.message, 'danger')
    } finally {
      setClaiming(false)
    }
  }

  const sendCommand = async (command: 'go_home' | 'stop' | 'start') => {
    const { error } = await supabase.from('robot_commands').insert({
      user_id: profile?.id,
      command
    })
    if (!error) {
      const labels = { go_home: 'Về nhà', stop: 'Dừng', start: 'Bắt đầu' }
      showNotif(`Đã gửi lệnh: ${labels[command]}`, 'success')
    } else {
      showNotif('Lỗi khi gửi lệnh!', 'danger')
    }
  }

  return (
    <div className="home-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* ── Robot Connection Banner ── */}
      {!loadingRobot && (
        currentRobot ? (
          /* Đã ghép đôi */
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--color-primary-dim)',
            border: '1px solid var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Đã ghép đôi: </span>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{currentRobot.id}</code>
              {currentRobot.name && (
                <span style={{ color: 'var(--color-muted-fg)', marginLeft: 8 }}>— {currentRobot.name}</span>
              )}
            </div>
          </div>
        ) : (
          /* Chưa ghép đôi */
          <div style={{
            padding: 'var(--space-4) var(--space-5)',
            background: 'color-mix(in srgb, #f59e0b 10%, var(--color-bg))',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chưa kết nối Robot nào</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-fg)', margin: '0 0 var(--space-3) 0' }}>
              Nhập mã MAC của robot (hiện trong Serial Monitor khi khởi động) để ghép đôi.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                id="mac-input"
                className="input"
                placeholder="VD: 240AC4010203"
                value={macInput}
                onChange={(e) => setMacInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && claimRobot()}
                style={{ fontFamily: 'var(--font-mono)', flex: 1, textTransform: 'uppercase' }}
              />
              <button
                id="btn-claim-robot"
                className="btn btn-primary"
                onClick={claimRobot}
                disabled={claiming || !macInput.trim()}
                style={{ gap: 8, whiteSpace: 'nowrap' }}
              >
                <Link2 size={16} />
                {claiming ? 'Đang kết nối...' : 'Kết nối'}
              </button>
            </div>
          </div>
        )
      )}

      {/* ── Main Grid: Camera + Controls ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
        {/* Camera */}
        <div>
          <div className="section-header">
            <span className="section-title">
              <Video size={16} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-primary)' }} />
              Camera Trực Tiếp
            </span>
          </div>
          <div className="organic-card" style={{ padding: 8, overflow: 'hidden' }}>
            <CameraFeed streamUrl={profile?.robot_config?.stream_url} />
          </div>
        </div>

        {/* Controls + Sensor */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div className="section-header">
              <span className="section-title">
                <Gamepad2 size={16} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-primary)' }} />
                Điều khiển Nhanh
              </span>
            </div>
            <div className="organic-card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary" onClick={() => sendCommand('start')} style={{ width: '100%', justifyContent: 'center', height: 48, gap: 10 }}>
                  <Play size={18} fill="currentColor" /> Bắt đầu làm việc
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <button className="btn btn-ghost" onClick={() => sendCommand('go_home')} style={{ gap: 8 }}>
                    <HomeIcon size={16} /> Trạm sạc
                  </button>
                  <button className="btn btn-danger" onClick={() => sendCommand('stop')} style={{ gap: 8 }}>
                    <CircleStop size={16} /> Dừng lại
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
              <span className="section-title">
                <BarChart3 size={16} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-primary)' }} />
                Trạng thái Hệ thống
              </span>
            </div>
            <div className="organic-card" style={{ padding: 'var(--space-5)' }}>
              <SensorHUD onLowBattery={() => showNotif('⚠️ Pin dưới 20%! Robot cần sạc.', 'warning')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
