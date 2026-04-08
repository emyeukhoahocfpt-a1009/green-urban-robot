import GpsMap from '../components/GpsMap'

export default function MapPage() {
  return (
    <div className="map-page animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <GpsMap />
    </div>
  )
}
