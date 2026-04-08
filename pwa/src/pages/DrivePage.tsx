import { useOutletContext } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import CameraFeed from '../components/CameraFeed'
import type { OutletContextType } from '../components/MainLayout'

export default function DrivePage() {
  const { profile } = useAuthStore()
  const { showNotif } = useOutletContext<OutletContextType>()

  const sendCommand = async (command: 'forward' | 'backward' | 'left' | 'right' | 'stop') => {
    const { error } = await supabase.from('robot_commands').insert({
      user_id: profile?.id,
      command
    })
    
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(50)
      console.log('Sent command:', command)
    } else {
      showNotif('Lỗi khi gửi lệnh điều hướng!', 'danger')
    }
  }

  return (
    <div className="home-page animate-fade-in">
      {/* Camera Feed */}
      <div className="glass-card panel camera-panel">
        <div className="section-header">
          <span className="section-title">📹 Camera Hành Trình</span>
        </div>
        <CameraFeed streamUrl={profile?.robot_config?.stream_url} />
      </div>

      {/* D-Pad Controller */}
      <div className="glass-card panel" style={{ marginTop: '20px' }}>
        <div className="section-header">
          <span className="section-title">🕹️ Điều hướng</span>
        </div>
        
        <p className="drive-header-info">
          Lưu ý: Robot cập nhật lệnh mỗi 2 giây. Bấm "Dừng" để phanh khẩn cấp.
        </p>

        <div className="d-pad-container">
          <div className="d-pad">
            <button className="d-pad-btn d-pad-up" onClick={() => sendCommand('forward')} title="Tiến lên">
              ⬆️
            </button>
            <button className="d-pad-btn d-pad-left" onClick={() => sendCommand('left')} title="Rẽ trái">
              ⬅️
            </button>
            <button className="d-pad-btn d-pad-center" onClick={() => sendCommand('stop')} title="Dừng (Phanh)">
              🛑
            </button>
            <button className="d-pad-btn d-pad-right" onClick={() => sendCommand('right')} title="Rẽ phải">
              ➡️
            </button>
            <button className="d-pad-btn d-pad-down" onClick={() => sendCommand('backward')} title="Lùi lại">
              ⬇️
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
