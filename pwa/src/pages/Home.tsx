import { useOutletContext } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import CameraFeed from '../components/CameraFeed'
import SensorHUD from '../components/SensorHUD'
import type { OutletContextType } from '../components/MainLayout'

export default function Home() {
  const { profile } = useAuthStore()
  const { showNotif } = useOutletContext<OutletContextType>()

  const sendCommand = async (command: 'go_home' | 'stop' | 'start') => {
    const { error } = await supabase.from('robot_commands').insert({
      user_id: profile?.id,
      command
    })
    if (!error) {
      const labels = { go_home: '🏠 Về nhà', stop: '⛔ Dừng', start: '▶️ Bắt đầu' }
      showNotif(`Đã gửi lệnh: ${labels[command]}`, 'success')
    } else {
      showNotif('Lỗi khi gửi lệnh!', 'danger')
    }
  }

  return (
    <div className="home-page animate-fade-in">
      {/* Camera Feed */}
      <div className="glass-card panel camera-panel">
        <div className="section-header">
          <span className="section-title">📹 Camera Trực Tiếp</span>
        </div>
        <CameraFeed streamUrl={profile?.robot_config?.stream_url} />
      </div>

      {/* Sensor & Commands */}
      <div className="glass-card panel">
        <div className="section-header">
          <span className="section-title">📊 Trạng thái Hệ thống</span>
        </div>
        <SensorHUD onLowBattery={() => showNotif('⚠️ Pin dưới 20%! Robot cần sạc.', 'warning')} />

        <div style={{ marginTop: '24px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <span className="section-title">🎮 Bảng Điều khiển</span>
          </div>
          <div className="command-row">
            <button className="btn btn-primary" onClick={() => sendCommand('start')}>
              ▶️ Bắt đầu làm việc
            </button>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn btn-ghost" onClick={() => sendCommand('go_home')} style={{ flex: 1 }}>
                🏠 Trở về trạm
              </button>
              <button className="btn btn-danger" onClick={() => sendCommand('stop')} style={{ flex: 1 }}>
                ⛔ Dừng khẩn cấp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
