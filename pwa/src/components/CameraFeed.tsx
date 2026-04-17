import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
import { 
  CameraOff, 
  RotateCw, 
  Maximize2, 
  Smartphone, 
  XCircle, 
  Save, 
  AlertCircle,
  RefreshCcw
} from 'lucide-react'

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
  
  // Advanced Camera Controls
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [isMirrored, setIsMirrored] = useState(false)
  const [isContain, setIsContain] = useState(false)

  useEffect(() => {
    if (initialUrl && !useLocalCam) { setUrl(initialUrl); setInputUrl(initialUrl) }
  }, [initialUrl, useLocalCam])

  // Request camera device list
  const updateDeviceList = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput')
      setDevices(videoDevices)
      if (!selectedDeviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId)
      }
    } catch (err) {
      console.error("Lỗi khi load danh sách camera: ", err)
    }
  }

  // Effect to request stream when local cam or device changes
  useEffect(() => {
    let streamRef: MediaStream | null = null;

    if (useLocalCam) {
      setImgError(false)
      
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : { facingMode: 'environment' }
      }

      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          setLocalStream(stream)
          streamRef = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
          // After granting permission, we can actually see device names. Let's refresh.
          updateDeviceList()
        })
        .catch(err => {
          console.error("Lỗi truy cập Camera Local:", err)
          setImgError(true)
          // Do not kick user out of Local Cam mode, simply show error inside it.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useLocalCam, selectedDeviceId])

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
      <div className="camera-feed-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
        {useLocalCam ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="camera-img" 
              style={{ 
                objectFit: isContain ? 'contain' : 'cover',
                transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)',
                transition: 'transform 0.3s ease',
                backgroundColor: '#000',
                width: '100%',
                height: '100%'
              }} 
            />
            <div className="camera-overlay">
              <span className="badge badge-online" style={{ background: 'var(--color-info)' }}>
                <span className="pulse-dot" style={{ background: '#fff' }} /> TEST CAM
              </span>
            </div>
            {imgError && (
              <div className="camera-offline" style={{ position: 'absolute', inset: 0, zIndex: 10, flexDirection: 'column', textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)' }}>
                <AlertCircle size={40} color="var(--color-danger)" style={{ marginBottom: '12px' }} />
                <span style={{ fontWeight: 600 }}>Không thể nạp thiết bị Camera này!</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '8px' }}>
                  Nếu bạn cấu hình <b>iVCam / DroidCam</b>, vui lòng đảm bảo phần mềm chủ đang chạy trên máy tính và điện thoại đã bật App phát kết nối.
                </span>
                <button className="btn btn-ghost" style={{ marginTop: '12px', gap: 8 }} onClick={() => { setImgError(false); updateDeviceList(); }}>
                  <RefreshCcw size={14} /> Thử lại / Refresh
                </button>
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
            <CameraOff size={48} strokeWidth={1.5} style={{ marginBottom: 12, opacity: 0.4 }} />
            <span>{imgError ? 'Không thể kết nối stream ESP32' : 'Chưa có URL stream'}</span>
            {imgError && url && (
              <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px', marginTop: 12, gap: 6 }}
                onClick={() => setImgError(false)}>
                <RefreshCcw size={12} /> Thử lại
              </button>
            )}
          </div>
        )}
      </div>

      {useLocalCam && devices.length > 0 && (
        <div className="glass-card panel" style={{ padding: '8px', marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            className="input" 
            style={{ flex: 1, minWidth: '150px' }}
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
          >
            {devices.map((d, i) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${i + 1} (iVCam / App)`}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${isMirrored ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setIsMirrored(!isMirrored)}
              style={{ padding: '6px 14px', fontSize: '0.85rem', gap: 8 }}
              title="Lật ngang khung hình"
            >
              <RotateCw size={14} /> Lật / Gương
            </button>
            <button 
              className={`btn ${isContain ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setIsContain(!isContain)}
              style={{ padding: '6px 14px', fontSize: '0.85rem', gap: 8 }}
              title="Cân bằng tỷ lệ Full/Fit tránh viền đen"
            >
              <Maximize2 size={14} /> Mở Rộng
            </button>
          </div>
        </div>
      )}

      <div className="stream-url-input" style={{ flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
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
            className={`btn ${useLocalCam ? 'btn-danger' : 'btn-ghost'}`}
            onClick={() => setUseLocalCam(!useLocalCam)}
            title="Dùng Camera của điện thoại/laptop này làm camera ảo để test"
            style={{ padding: '8px 14px', whiteSpace: 'nowrap', gap: 8 }}
            type="button"
          >
            {useLocalCam ? (
              <><XCircle size={16} /> Tắt Test Cam</>
            ) : (
              <><Smartphone size={16} /> Mở Trình Test Cam</>
            )}
          </button>
          
          <button
            id="btn-save-stream"
            className="btn btn-primary"
            onClick={saveUrl}
            disabled={saving || useLocalCam}
            style={{ padding: '8px 16px', whiteSpace: 'nowrap', gap: 8 }}
          >
            {saving ? '...' : <><Save size={16} /> Lưu</>}
          </button>
        </div>
      </div>
    </div>
  )
}
