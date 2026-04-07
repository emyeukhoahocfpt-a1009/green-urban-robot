import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { setSession, fetchProfile } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
