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
  BarChart3
} from 'lucide-react'

export default function Home() {
  const { profile } = useAuthStore()
  const { showNotif } = useOutletContext<OutletContextType>()

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
    <div className="home-page animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)' }}>
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

      {/* Status & Controls */}
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
  )
}
