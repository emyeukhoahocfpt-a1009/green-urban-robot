import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

interface Props {
  streamUrl?: string
}

export default function CameraFeed({ streamUrl: initialUrl }: Props) {
  const { profile, fetchProfile } = useAuthStore()
  const [url, setUrl] = useState(initialUrl || '')
  const [inputUrl, setInputUrl] = useState(initialUrl || '')
  const [imgError, setImgError] = useState(false)
  const [saving, setSaving] = useState(false)

  const [useLocalCam, setUseLocalCam] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    if (initialUrl && !useLocalCam) { setUrl(initialUrl); setInputUrl(initialUrl) }
  }, [initialUrl, useLocalCam])

  useEffect(() => {
    let streamRef: MediaStream | null = null;
    if (useLocalCam) {
      setImgError(false)
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          setLocalStream(stream)
          streamRef = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch(err => {
          console.error("Lỗi truy cập Camera Local:", err)
          setImgError(true)
          setUseLocalCam(false)
        })
    } else {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
        setLocalStream(null)
      }
    }

    return () => {
      if (streamRef) {
        streamRef.getTracks().forEach(track => track.stop())
      }
    }
  }, [useLocalCam])

  const saveUrl = async () => {
    if (!profile) return
    setSaving(true)
    const newConfig = { ...profile.robot_config, stream_url: inputUrl }
    await supabase.from('profiles').update({ robot_config: newConfig }).eq('id', profile.id)
    setUrl(inputUrl)
    setImgError(false)
    await fetchProfile(profile.id)
    setSaving(false)
  }

  return (
    <div>
      <div className="camera-feed-wrapper">
        {useLocalCam ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="camera-img" 
              style={{ objectFit: 'cover' }} 
            />
            <div className="camera-overlay">
              <span className="badge badge-online" style={{ background: 'var(--color-info)' }}>
                <span className="pulse-dot" style={{ background: '#fff' }} /> LOCAL TEST
              </span>
            </div>
            {imgError && (
              <div className="camera-offline" style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
                <span>Không thể truy cập quyền Camera!</span>
              </div>
            )}
          </>
        ) : url && !imgError ? (
          <>
            <img
              id="camera-img"
              className="camera-img"
              src={url}
              alt="MJPEG Camera Stream"
              onError={() => setImgError(true)}
            />
            <div className="camera-overlay">
              <span className="badge badge-online"><span className="pulse-dot" /> LIVE</span>
            </div>
          </>
        ) : (
          <div className="camera-offline">
            <span style={{ fontSize: '3rem' }}>📷</span>
            <span>{imgError ? 'Không thể kết nối stream ESP32' : 'Chưa có URL stream'}</span>
            {imgError && url && (
              <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => setImgError(false)}>
                Thử lại
              </button>
            )}
          </div>
        )}
      </div>

      <div className="stream-url-input" style={{ flexWrap: 'wrap', gap: '8px' }}>
        <input
          id="stream-url-input"
          className="input"
          style={{ flex: 1, minWidth: '200px' }}
          type="url"
          placeholder="URL MJPEG (ESP32 / Cloudflare)"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
          disabled={useLocalCam}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setUseLocalCam(!useLocalCam)}
            title="Dùng Camera của điện thoại/laptop này làm camera ảo để test"
            style={{ padding: '8px 12px' }}
            type="button"
          >
            {useLocalCam ? '❌ Tắt Test Cam' : '📱 Dùng Local Cam'}
          </button>
          
          <button
            id="btn-save-stream"
            className="btn btn-primary"
            onClick={saveUrl}
            disabled={saving || useLocalCam}
            style={{ padding: '8px 16px' }}
          >
            {saving ? '...' : '💾 Lưu'}
          </button>
        </div>
      </div>
    </div>
  )
}
