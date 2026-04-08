import { useRef, useState } from 'react'
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
  
  const [controlMode, setControlMode] = useState<'joystick' | 'gamepad'>('joystick')

  const sendCommand = async (command: 'forward' | 'backward' | 'left' | 'right' | 'stop') => {
    const { error } = await supabase.from('robot_commands').insert({
      user_id: profile?.id,
      command
    })
    
    if (!error) {
      if (navigator.vibrate) navigator.vibrate(20) // Give a tiny haptic feedback
      console.log('Sent command:', command)
    } else {
      showNotif('Lỗi khi gửi lệnh điều hướng!', 'danger')
    }
  }

  // Joystick specific handlers
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

  // Gamepad specific handlers
  const handlePointerDown = (cmd: 'forward' | 'backward' | 'left' | 'right') => {
    sendCommand(cmd)
  }

  const handlePointerUp = () => {
    sendCommand('stop')
  }

  const toggleMode = () => {
    setControlMode(prev => prev === 'joystick' ? 'gamepad' : 'joystick')
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

      <div className="glass-card panel" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="section-header" style={{ alignSelf: 'flex-start', width: '100%' }}>
          <span className="section-title">🕹️ Hệ thống Lái</span>
        </div>
        
        <p className="drive-header-info" style={{ alignSelf: 'flex-start', marginBottom: '24px' }}>
          {controlMode === 'joystick' 
            ? 'Di chuyển cần điều khiển để đổi hướng. Nhả tay để phanh.' 
            : 'Chạm và giữ chân ga/vô lăng để chạy. Nhả tay để phanh an toàn.'}
        </p>

        {/* Toggle Switch */}
        <div className="switch-container">
          <span className={`switch-label ${controlMode === 'joystick' ? 'active' : ''}`} onClick={() => setControlMode('joystick')}>
            Joystick
          </span>
          <div className={`switch-track ${controlMode === 'gamepad' ? 'toggled' : ''}`} onClick={toggleMode}>
            <div className="switch-thumb"></div>
          </div>
          <span className={`switch-label ${controlMode === 'gamepad' ? 'active' : ''}`} onClick={() => setControlMode('gamepad')}>
            Racing Gamepad
          </span>
        </div>

        {/* Controller View */}
        {controlMode === 'joystick' ? (
          <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Joystick 
              size={120} 
              sticky={false} 
              baseColor="var(--glass-bg)" 
              stickColor="var(--color-primary)" 
              move={handleMove} 
              stop={handleStop}
            />
          </div>
        ) : (
          <div className="gamepad-container">
            <div className="gamepad-pad gamepad-left-cluster">
              <div 
                className="gamepad-btn steer-left" 
                onPointerDown={(e) => { e.currentTarget.classList.add('pressed'); handlePointerDown('left'); }} 
                onPointerUp={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }} 
                onPointerLeave={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }}
              >
                ⬅️
              </div>
              <div 
                className="gamepad-btn steer-right" 
                onPointerDown={(e) => { e.currentTarget.classList.add('pressed'); handlePointerDown('right'); }} 
                onPointerUp={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }} 
                onPointerLeave={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }}
              >
                ➡️
              </div>
            </div>
            <div className="gamepad-pad gamepad-right-cluster">
              <div 
                className="gamepad-btn pedal-gas" 
                onPointerDown={(e) => { e.currentTarget.classList.add('pressed'); handlePointerDown('forward'); }} 
                onPointerUp={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }} 
                onPointerLeave={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }}
                style={{ fontSize: '1rem', flexDirection: 'column' }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⬆️</div>
                <strong style={{ opacity: 0.8 }}>GA</strong>
              </div>
              <div 
                className="gamepad-btn pedal-brake" 
                onPointerDown={(e) => { e.currentTarget.classList.add('pressed'); handlePointerDown('backward'); }} 
                onPointerUp={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }} 
                onPointerLeave={(e) => { e.currentTarget.classList.remove('pressed'); handlePointerUp(); }}
              >
                ⬇️
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
