import { useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import CameraFeed from '../components/CameraFeed'
import { Joystick } from 'react-joystick-component'
import type { OutletContextType } from '../components/MainLayout'

export default function DrivePage() {
  const { profile } = useAuthStore()
  const { showNotif } = useOutletContext<OutletContextType>()
  const lastDir = useRef<string | null>(null)

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

  const handleMove = (e: any) => {
    if (e.direction && e.direction !== lastDir.current) {
      lastDir.current = e.direction
      const dirMap: Record<string, 'forward' | 'backward' | 'left' | 'right'> = {
        FORWARD: 'forward',
        BACKWARD: 'backward',
        LEFT: 'left',
        RIGHT: 'right'
      }
      if (dirMap[e.direction]) {
        sendCommand(dirMap[e.direction])
      }
    }
  }

  const handleStop = () => {
    lastDir.current = null
    sendCommand('stop')
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

      {/* Joystick Controller */}
      <div className="glass-card panel" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="section-header" style={{ alignSelf: 'flex-start' }}>
          <span className="section-title">🕹️ Joystick Điều hướng</span>
        </div>
        
        <p className="drive-header-info" style={{ alignSelf: 'flex-start' }}>
          Di chuyển cần điều khiển để đổi hướng. Nhả ra để tự động phanh (Dừng).
        </p>

        <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
          <Joystick 
            size={120} 
            sticky={false} 
            baseColor="var(--glass-bg)" 
            stickColor="var(--color-primary)" 
            move={handleMove} 
            stop={handleStop}
          />
        </div>
      </div>
    </div>
  )
}
