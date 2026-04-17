import { useEffect, useState, useRef } from 'react'
import { supabase, type Telemetry } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { 
  Battery, 
  BatteryLow, 
  BatteryFull, 
  Droplets, 
  Thermometer 
} from 'lucide-react'

interface Props {
  onLowBattery: () => void
}

export default function SensorHUD({ onLowBattery }: Props) {
  const { profile } = useAuthStore()
  const [data, setData] = useState<Partial<Telemetry>>({ battery_pct: 0, humidity: 0, temperature: 0 })
  const alertedRef = useRef(false)

  useEffect(() => {
    if (!profile) return

    // Load latest
    supabase
      .from('robot_telemetry')
      .select('*')
      .eq('user_id', profile.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
      .then(({ data: row }) => { if (row) setData(row) })

    // Realtime subscription
    const channel = supabase
      .channel('sensor-hud')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'robot_telemetry',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        const row = payload.new as Telemetry
        setData(row)
        if (row.battery_pct < 20 && !alertedRef.current) {
          alertedRef.current = true
          onLowBattery()
          setTimeout(() => { alertedRef.current = false }, 60000)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const batteryColor = (pct: number) => {
    if (pct > 50) return 'var(--color-primary)'
    if (pct > 20) return 'var(--color-warning)'
    return 'var(--color-danger)'
  }

  const sensors = [
    {
      id: 'sensor-battery',
      icon: (
        <span style={{ color: batteryColor(data.battery_pct ?? 0) }}>
          {data.battery_pct! > 50 ? <BatteryFull size={24} /> : 
           data.battery_pct! > 20 ? <Battery size={24} /> : 
           <BatteryLow size={24} />}
        </span>
      ),
      value: `${(data.battery_pct ?? 0).toFixed(0)}%`,
      label: 'Pin',
      extra: (
        <div className="battery-bar-wrapper">
          <div className="battery-bar" style={{
            width: `${data.battery_pct ?? 0}%`,
            background: batteryColor(data.battery_pct ?? 0)
          }} />
        </div>
      )
    },
    {
      id: 'sensor-humidity',
      icon: <Droplets size={24} style={{ color: '#3498db' }} />,
      value: `${(data.humidity ?? 0).toFixed(1)}%`,
      label: 'Độ ẩm'
    },
    {
      id: 'sensor-temp',
      icon: <Thermometer size={24} style={{ color: '#e67e22' }} />,
      value: `${(data.temperature ?? 0).toFixed(1)}°C`,
      label: 'Nhiệt độ'
    }
  ]

  return (
    <div className="sensor-grid">
      {sensors.map(s => (
        <div key={s.id} id={s.id} className="sensor-card">
          <div className="sensor-icon">{s.icon}</div>
          <div className="metric-value">{s.value}</div>
          <div className="metric-label">{s.label}</div>
          {s.extra}
        </div>
      ))}
    </div>
  )
}
