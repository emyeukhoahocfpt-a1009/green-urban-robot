import { useRef, useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import CameraFeed from '../components/CameraFeed'
import { Joystick } from 'react-joystick-component'
import type { OutletContextType } from '../components/MainLayout'
import { 
  Gamepad2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react'

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
      if (navigator.vibrate) navigator.vibrate(20)
    } else {
      showNotif('Lỗi khi gửi lệnh điều hướng!', 'danger')
    }
  }

  const handleMove = (e: any) => {
    if (e.direction && e.direction !== lastDir.current) {
      lastDir.current = e.direction
      const dirMap: Record<string, 'forward' | 'backward' | 'left' | 'right'> = {
        FORWARD: 'forward', BACKWARD: 'backward', LEFT: 'left', RIGHT: 'right'
      }
      if (dirMap[e.direction]) sendCommand(dirMap[e.direction])
    }
  }

  const handleStop = () => { lastDir.current = null; sendCommand('stop') }

  // Hardware gamepad polling
  const gamepadsLoopRef = useRef<number | null>(null)
  const lastGamepadDir = useRef<string | null>(null)

  useEffect(() => {
    const pollGamepads = () => {
      const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : []
      const gp = Array.from(gamepads).find(g => g !== null)
      if (gp) {
        let dir: null | 'forward' | 'backward' | 'left' | 'right' = null
        const threshold = 0.5
        if (gp.buttons[12]?.pressed || (gp.axes[1] && gp.axes[1] < -threshold)) dir = 'forward'
        else if (gp.buttons[13]?.pressed || (gp.axes[1] && gp.axes[1] > threshold)) dir = 'backward'
        else if (gp.buttons[14]?.pressed || (gp.axes[0] && gp.axes[0] < -threshold)) dir = 'left'
        else if (gp.buttons[15]?.pressed || (gp.axes[0] && gp.axes[0] > threshold)) dir = 'right'
        if (dir !== lastGamepadDir.current) {
          lastGamepadDir.current = dir
          dir ? sendCommand(dir) : sendCommand('stop')
        }
      }
      gamepadsLoopRef.current = requestAnimationFrame(pollGamepads)
    }
    gamepadsLoopRef.current = requestAnimationFrame(pollGamepads)
    return () => { if (gamepadsLoopRef.current) cancelAnimationFrame(gamepadsLoopRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  const handlePointerDown = (cmd: 'forward' | 'backward' | 'left' | 'right') => sendCommand(cmd)
  const handlePointerUp = () => sendCommand('stop')
  const toggleMode = () => setControlMode(prev => prev === 'joystick' ? 'gamepad' : 'joystick')

  return (
    <div className="drive-layout animate-fade-in">
      {/* Camera */}
      <div className="drive-camera-container organic-card" style={{ padding: 8, overflow: 'hidden' }}>
        <CameraFeed streamUrl={profile?.robot_config?.stream_url} />
      </div>

      {/* Controls */}
      <div className="drive-controls-container organic-card" style={{ padding: 'var(--space-5)' }}>
        {/* Header with toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <span className="section-title">
              <Gamepad2 size={16} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--color-primary)' }} />
              Điều khiển
            </span>
          </div>
          <div className="switch-container" style={{ marginBottom: 0 }}>
            <span className={`switch-label ${controlMode === 'joystick' ? 'active' : ''}`} onClick={() => setControlMode('joystick')}>Stick</span>
            <div className={`switch-track ${controlMode === 'gamepad' ? 'toggled' : ''}`} onClick={toggleMode}>
              <div className="switch-thumb"></div>
            </div>
            <span className={`switch-label ${controlMode === 'gamepad' ? 'active' : ''}`} onClick={() => setControlMode('gamepad')}>Pad</span>
          </div>
        </div>

        {/* Controller area — fixed min-height to prevent layout jump */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, padding: 'var(--space-4) 0' }}>
          {controlMode === 'joystick' ? (
            <Joystick
              size={160}
              sticky={false}
              baseColor="var(--color-muted)"
              stickColor="var(--color-primary)"
              move={handleMove}
              stop={handleStop}
            />
          ) : (
            <div style={{ display: 'flex', width: '100%', maxWidth: 420, justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Steering */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="gamepad-btn" style={{ width: 72, height: 72, borderRadius: 'var(--radius-lg)', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }} onPointerDown={() => handlePointerDown('left')} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                  <ChevronLeft size={32} />
                </button>
                <button className="gamepad-btn" style={{ width: 72, height: 72, borderRadius: 'var(--radius-lg)', background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }} onPointerDown={() => handlePointerDown('right')} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                  <ChevronRight size={32} />
                </button>
              </div>
              {/* Gas / Brake */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="gamepad-btn" style={{ width: 80, height: 100, borderRadius: 'var(--radius-xl)', background: 'var(--color-primary)', color: 'var(--color-primary-fg)', border: 'none', flexDirection: 'column', gap: 4 }} onPointerDown={() => handlePointerDown('forward')} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                  <ChevronUp size={28} strokeWidth={3} />
                  <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>GAS</span>
                </button>
                <button className="gamepad-btn" style={{ width: 80, height: 60, borderRadius: 'var(--radius-xl)', background: 'var(--color-danger)', color: 'white', border: 'none' }} onPointerDown={() => handlePointerDown('backward')} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                  <ChevronDown size={28} strokeWidth={3} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
