import { useOutletContext } from 'react-router-dom'
import SchedulePanel from '../components/SchedulePanel'
import type { OutletContextType } from '../components/MainLayout'

export default function SchedulePage() {
  const { showNotif } = useOutletContext<OutletContextType>()

  return (
    <div className="schedule-page animate-fade-in">
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <span className="section-title">📅 Lịch trình Hoạt động</span>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
          Thiết lập thời gian và khu vực tự động làm việc cho robot.
        </p>
      </div>
      
      <div className="glass-card panel">
        <SchedulePanel onNotif={showNotif} />
      </div>
    </div>
  )
}
