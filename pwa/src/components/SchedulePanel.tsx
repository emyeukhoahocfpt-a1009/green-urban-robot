import { useState, useEffect } from 'react'
import { supabase, type Schedule } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

import {
  Plus,
  Trash2,
  Play,
  Pause,
  Home as HomeIcon,
  Clock
} from 'lucide-react'

interface Props {
  onNotif: (msg: string, type: 'success' | 'danger' | 'warning') => void
}

export default function SchedulePanel({ onNotif }: Props) {
  const { session } = useAuthStore()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [label, setLabel] = useState('Lịch cắt cỏ')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const returnHomeTime = startTime
    ? new Date(new Date(startTime).getTime() + duration * 3600000).toISOString()
    : null

  const formatLocal = (iso: string) =>
    new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('robot_schedules')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_time', { ascending: true })
      .then(({ data, error }) => {
        if (data) setSchedules(data as Schedule[])
        else if (error) console.error('Lỗi tải lịch:', error)
        setLoading(false)
      })
  }, [session?.user?.id])

  const addSchedule = async () => {
    if (!session?.user?.id || !startTime) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('robot_schedules')
        .insert({
          user_id: session.user.id,
          label,
          start_time: new Date(startTime).toISOString(),
          run_duration_hours: duration,
          return_home_time: returnHomeTime!,
          active: true,
          notified: false
        })
        .select()
        .single()

      if (!error && data) {
        setSchedules(prev => [...prev, data as Schedule].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ))
        setStartTime('')
        setDuration(1)
        onNotif('Đã thêm lịch thành công!', 'success')
      } else {
        console.error('Lỗi thêm lịch:', error)
        onNotif(`Lỗi: ${error?.message || 'Unknown'} (${error?.code || '?'})`, 'danger')
      }
    } catch (err) {
      console.error('Try/catch lỗi:', err)
      onNotif('Dữ liệu không hợp lệ', 'danger')
    }
    setSaving(false)
  }

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('robot_schedules').update({ active: !current }).eq('id', id)
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !current } : s))
  }

  const deleteSchedule = async (id: number) => {
    await supabase.from('robot_schedules').delete().eq('id', id)
    setSchedules(prev => prev.filter(s => s.id !== id))
    onNotif('Đã xoá lịch', 'warning')
  }

  return (
    <div>
      {/* Add Form */}
      <div className="schedule-form">
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Tên lịch</label>
          <input className="input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Tên lịch..." />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Thời gian bắt đầu</label>
          <input
            id="schedule-start"
            type="datetime-local"
            className="input"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Thời gian chạy (giờ)</label>
          <input
            id="schedule-duration"
            type="number"
            className="input"
            min={0.5} max={24} step={0.5}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Về nhà lúc (tự tính)</label>
          <input
            className="input"
            readOnly
            value={returnHomeTime ? formatLocal(returnHomeTime) : '—'}
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
        </div>
      </div>

      <button
        id="btn-add-schedule"
        className="btn btn-primary"
        onClick={addSchedule}
        disabled={saving || !startTime}
        style={{ marginBottom: '20px', gap: 8 }}
      >
        {saving ? '...' : <><Plus size={16} /> Thêm lịch</>}
      </button>

      {/* Schedule List */}
      <div className="schedule-list">
        {loading && <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>Đang tải...</p>}
        {!loading && schedules.length === 0 && (
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>Chưa có lịch nào</p>
        )}
        {schedules.map(s => (
          <div key={s.id} className={`schedule-item ${!s.active ? 'inactive' : ''}`}>
            <div className="schedule-info">
              <div className="schedule-label">{s.label}</div>
              <div className="schedule-times" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Play size={10} fill="currentColor" /> {formatLocal(s.start_time)}
                <span style={{ opacity: 0.5 }}>→</span>
                <HomeIcon size={10} /> {formatLocal(s.return_home_time)}
                <span style={{ opacity: 0.5 }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> {s.run_duration_hours}h
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                className={`btn ${s.active ? 'btn-ghost' : 'btn-primary'}`}
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: 6 }}
                onClick={() => toggleActive(s.id, s.active)}
              >
                {s.active ? <><Pause size={12} fill="currentColor" /> Tắt</> : <><Play size={12} fill="currentColor" /> Bật</>}
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: '6px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => deleteSchedule(s.id)}
                title="Xoá lịch"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
