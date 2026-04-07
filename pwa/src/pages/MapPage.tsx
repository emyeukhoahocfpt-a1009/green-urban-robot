import GpsMap from '../components/GpsMap'

export default function MapPage() {
  return (
    <div className="map-page animate-fade-in" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <span className="section-title">🗺️ Theo dõi Vị trí Robot</span>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginTop: '4px' }}>
          Định vị vị trí hiện tại và lịch sử đường đi của robot theo thời gian thực.
        </p>
      </div>
      
      <div className="glass-card" style={{ flex: 1, padding: '4px', overflow: 'hidden' }}>
        <GpsMap />
      </div>
    </div>
  )
}
