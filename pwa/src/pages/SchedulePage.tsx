import { useOutletContext } from 'react-router-dom'
import SchedulePanel from '../components/SchedulePanel'
import type { OutletContextType } from '../components/MainLayout'

export default function SchedulePage() {
  const { showNotif } = useOutletContext<OutletContextType>()

  return (
    <div className="schedule-page animate-fade-in">
      <div className="section-header" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span className="section-title" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', fontSize: '1.2rem' }}>📅 Lịch trình Hoạt động</span>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted-fg)', marginTop: '4px' }}>
          Thiết lập thời gian và khu vực tự động làm việc cho robot.
        </p>
      </div>
      
      <div className="organic-card" style={{ padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)' }}>
        <SchedulePanel onNotif={showNotif} />
      </div>
    </div>
  )
}
