import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (initialUrl) { setUrl(initialUrl); setInputUrl(initialUrl) }
  }, [initialUrl])

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
        {url && !imgError ? (
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
            <span>{imgError ? 'Không thể kết nối stream' : 'Chưa có URL stream'}</span>
            {imgError && url && (
              <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => setImgError(false)}>
                Thử lại
              </button>
            )}
          </div>
        )}
      </div>

      <div className="stream-url-input">
        <input
          id="stream-url-input"
          className="input"
          type="url"
          placeholder="http://192.168.x.x/stream hoặc Cloudflare Tunnel URL"
          value={inputUrl}
          onChange={e => setInputUrl(e.target.value)}
        />
        <button
          id="btn-save-stream"
          className="btn btn-primary"
          onClick={saveUrl}
          disabled={saving}
          style={{ whiteSpace: 'nowrap' }}
        >
          {saving ? '...' : '💾 Lưu'}
        </button>
      </div>
    </div>
  )
}
