import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { meRequest } from '../../api/auth'
import Sidebar from '../Sidebar/Sidebar'

const SMALL_SCREEN = '(max-width: 900px)'

export type UserProfile = {
  firstName: string
  secondName: string
}

export type Room = {
  id: number
  name: string
}

export type LayoutContext = {
  profile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  rooms: Room[]
  addRoom: (name: string) => Room
}

export default function Layout() {
  // на маленьких экранах панель по умолчанию свернута
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(SMALL_SCREEN).matches)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    meRequest()
      .then((user) => {
        setProfile({ firstName: user.first_name || 'guest', secondName: user.second_name || '' })
      })
      .catch(() => setProfile({ firstName: 'guest', secondName: '' }))
  }, [])

  const collapseOnSmallScreen = () => {
    if (window.matchMedia(SMALL_SCREEN).matches) setCollapsed(true)
  }

  const addRoom = (name: string) => {
    const room = { id: Date.now(), name }
    setRooms((current) => [...current, room])
    return room
  }

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onNavigate={collapseOnSmallScreen}
        userName={profile?.firstName || 'guest'}
      />

      {!collapsed && <div className="backdrop" onClick={() => setCollapsed(true)} />}

      <main className="content">
        <Outlet context={{ profile, setProfile, rooms, addRoom } satisfies LayoutContext} />
      </main>
    </div>
  )
}
