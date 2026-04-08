import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase, type Telemetry } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

import icon from 'leaflet/dist/images/marker-icon.png'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow,
})

const TRAIL_LIMIT = 50

export default function GpsMap() {
  const { profile } = useAuthStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const trailRef = useRef<[number, number][]>([])
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return

    const map = L.map(mapRef.current, {
      center: [10.7769, 106.7009], // HCM City default
      zoom: 15,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    leafletMap.current = map

    // Fix tile loading in flex/absolute containers
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })
    observer.observe(mapRef.current)

    return () => { 
      observer.disconnect()
      map.remove()
      leafletMap.current = null 
    }
  }, [])

  useEffect(() => {
    if (!profile) return

    supabase
      .from('robot_telemetry')
      .select('gps_lat, gps_lng, timestamp')
      .eq('user_id', profile.id)
      .order('timestamp', { ascending: false })
      .limit(TRAIL_LIMIT)
      .then(({ data: rows }) => {
        if (!rows || !leafletMap.current) return
        const valid = rows.filter(r => r.gps_lat !== 0 && r.gps_lng !== 0)
        if (valid.length === 0) return
        const pts: [number, number][] = valid.reverse().map(r => [r.gps_lat, r.gps_lng])
        trailRef.current = pts
        renderTrail(pts, valid[valid.length - 1])
      })

    const channel = supabase
      .channel('gps-map')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'robot_telemetry',
        filter: `user_id=eq.${profile.id}`
      }, (payload) => {
        const row = payload.new as Telemetry
        if (row.gps_lat === 0 && row.gps_lng === 0) return
        const pt: [number, number] = [row.gps_lat, row.gps_lng]
        trailRef.current = [...trailRef.current.slice(-TRAIL_LIMIT + 1), pt]
        setCurrentPos({ lat: row.gps_lat, lng: row.gps_lng })
        renderTrail(trailRef.current, row)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const renderTrail = (pts: [number, number][], latest: { gps_lat: number; gps_lng: number }) => {
    const map = leafletMap.current
    if (!map) return
    if (polylineRef.current) polylineRef.current.remove()
    if (markerRef.current) markerRef.current.remove()
    if (pts.length > 1) {
      polylineRef.current = L.polyline(pts, { color: '#4A7C59', weight: 3, opacity: 0.8, dashArray: '6, 4' }).addTo(map)
    }
    markerRef.current = L.marker([latest.gps_lat, latest.gps_lng])
      .addTo(map)
      .bindPopup(`🤖 Robot<br>Lat: ${latest.gps_lat.toFixed(6)}<br>Lng: ${latest.gps_lng.toFixed(6)}`)
    map.setView([latest.gps_lat, latest.gps_lng], 16)
  }

  const openGoogleMaps = () => {
    if (!currentPos) return
    window.open(`https://maps.google.com/?q=${currentPos.lat},${currentPos.lng}`, '_blank')
  }

  return (
    <div className="map-container-full" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div 
        id="gps-map" 
        ref={mapRef} 
        style={{ 
          flex: 1, 
          width: '100%', 
          height: '100%', 
          background: '#e0e0e0', // Placeholder background to confirm container is visible
          position: 'relative' 
        }} 
      />
      {/* Floating info at bottom */}
      <div className="map-floating-overlay">
        <div className="floating-card">
          {currentPos ? (
            <>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted-fg)', fontFamily: 'var(--font-mono)' }}>
                📍 {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
              </span>
              <button className="btn btn-primary btn-sm" onClick={openGoogleMaps}>
                Mở Maps
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted-fg)' }}>
              📍 HCM City (mặc định) — Chờ tín hiệu GPS từ Robot
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
