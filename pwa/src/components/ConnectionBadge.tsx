import { useState, useEffect } from 'react'
import { Wifi, WifiOff, CloudOff } from 'lucide-react'

interface Props {
  lastHeartbeat: string | null
}

export default function ConnectionBadge({ lastHeartbeat }: Props) {
  const [status, setStatus] = useState<'online' | 'offline' | 'unknown'>('unknown')

  useEffect(() => {
    const check = () => {
      if (!lastHeartbeat) { setStatus('unknown'); return }
      const diff = (Date.now() - new Date(lastHeartbeat).getTime()) / 1000
      setStatus(diff < 30 ? 'online' : 'offline')
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [lastHeartbeat])

  const config = {
    online:  { cls: 'badge-online',  icon: <Wifi size={14} />, label: 'Online' },
    offline: { cls: 'badge-offline', icon: <WifiOff size={14} />, label: 'Offline' },
    unknown: { cls: 'badge-warning', icon: <CloudOff size={14} />, label: 'Chưa kết nối' }
  }[status]

  return (
    <div id="connection-badge" className={`badge ${config.cls}`} style={{ fontSize: '0.65rem' }}>
      <span className="pulse-dot" />
      {config.icon} {config.label}
    </div>
  )
}
