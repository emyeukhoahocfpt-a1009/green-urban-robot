import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

export type Profile = {
  id: string
  role: 'admin' | 'user'
  robot_config: {
    stream_url: string
    bridge_url: string
  }
  last_location: {
    lat: number
    lng: number
  }
}

export type Telemetry = {
  id: number
  user_id: string
  battery_pct: number
  humidity: number
  temperature: number
  gps_lat: number
  gps_lng: number
  timestamp: string
}

export type Schedule = {
  id: number
  user_id: string
  label: string
  start_time: string
  run_duration_hours: number
  return_home_time: string
  active: boolean
  notified: boolean
}

export type RobotCommand = 'go_home' | 'stop' | 'start'
