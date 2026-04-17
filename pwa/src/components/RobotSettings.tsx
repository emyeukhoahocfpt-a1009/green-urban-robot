import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { X, Cpu, Check, ShieldCheck, AlertCircle } from 'lucide-react'

interface RobotSettingsProps {
  onClose: () => void
  showNotif: (msg: string, type?: 'success' | 'danger' | 'warning') => void
}

export default function RobotSettings({ onClose, showNotif }: RobotSettingsProps) {
  const { profile } = useAuthStore()
  const [deviceId, setDeviceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentRobot, setCurrentRobot] = useState<any>(null)

  useEffect(() => {
    fetchCurrentRobot()
  }, [])

  const fetchCurrentRobot = async () => {
    if (!profile) return
    const { data, error } = await supabase
      .from('robots')
      .select('*')
      .eq('owner_id', profile.id)
      .maybeSingle()
    
    if (data) setCurrentRobot(data)
  }

  const claimRobot = async () => {
    if (!deviceId || !profile) return
    setLoading(true)
    
    const cleanId = deviceId.toUpperCase().replace(/[:\s]/g, '')

    try {
      // Cập nhật chủ sở hữu cho Robot có mã MAC tương ứng
      const { error } = await supabase
        .from('robots')
        .update({ owner_id: profile.id, name: 'My Green Robot' })
        .eq('id', cleanId)

      if (error) throw error

      showNotif('Đã kết nối Robot thành công!', 'success')
      fetchCurrentRobot()
      setDeviceId('')
    } catch (err: any) {
      showNotif('Lỗi: ' + err.message, 'danger')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      padding: 'var(--space-4)'
    }}>
      <div className="organic-card animate-fade-in" style={{
        width: '100%', maxWidth: 400, background: 'var(--color-bg)',
        overflow: 'hidden', position: 'relative'
      }}>
        <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={20} color="var(--color-primary)" /> Cài đặt Robot
          </h3>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 4, border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-5)' }}>
          {currentRobot ? (
            <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-primary-dim)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-primary)', fontWeight: 600 }}>
                <ShieldCheck size={18} /> Đã ghép đôi
              </div>
              <div style={{ marginTop: 8, fontSize: '0.85rem' }}>
                <p><strong>ID:</strong> <code style={{fontFamily: 'var(--font-mono)'}}>{currentRobot.id}</code></p>
                <p><strong>Tên:</strong> {currentRobot.name}</p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--color-muted-fg)' }}>
              <AlertCircle size={18} /> Bạn chưa kết nối với Robot nào.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted-fg)' }}>NHẬN ROBOT MỚI (NHẬP MÃ MAC)</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input 
                className="input" 
                placeholder="VD: 240AC4010203" 
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <button 
                className="btn btn-primary" 
                onClick={claimRobot}
                disabled={loading || !deviceId}
              >
                {loading ? '...' : <Check size={18} />}
              </button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-muted-fg)', fontStyle: 'italic' }}>
              * Mã MAC hiện trong Serial Monitor khi Robot khởi động.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
