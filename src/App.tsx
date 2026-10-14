import { useLayoutEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ChatPage } from './pages/Chat'
import { ComposePage } from './pages/Compose'
import { DailyPage } from './pages/Daily'
import { FeedPage } from './pages/Feed'
import { FriendPage } from './pages/Friend'
import { HomePage } from './pages/Home'
import { LandingPage } from './pages/Landing'
import { MessagesPage } from './pages/Messages'
import { ProfilePage } from './pages/Profile'
import { Shell } from './Shell'
import { useStore } from './store'

function Guard() {
  const { data } = useStore()
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('.stage')?.scrollTo(0, 0)
  }, [pathname])
  if (!data.onboarded) return <Navigate to="/" replace />
  return <Outlet />
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Guard />}>
        <Route element={<Shell />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/me" element={<ProfilePage />} />
        </Route>
        <Route path="/feed/:personId" element={<FeedPage />} />
        <Route path="/compose" element={<ComposePage />} />
        <Route path="/chat/:personId" element={<ChatPage />} />
        <Route path="/friend/:personId" element={<FriendPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
