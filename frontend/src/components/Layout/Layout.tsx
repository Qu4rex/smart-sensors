import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { meRequest } from '../../api/auth'
import { createRoom, deleteRoom as deleteRoomRequest, listRooms, updateRoom as updateRoomRequest } from '../../api/rooms'
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
  addRoom: (name: string) => Promise<Room>
  updateRoom: (id: number, name: string) => Promise<Room>
  deleteRoom: (id: number) => Promise<void>
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

  useEffect(() => {
    listRooms().then(setRooms).catch(() => undefined)
  }, [])

  const collapseOnSmallScreen = () => {
    if (window.matchMedia(SMALL_SCREEN).matches) setCollapsed(true)
  }

  const addRoom = async (name: string) => {
    const room = await createRoom(name)
    setRooms((current) => [...current, room])
    return room
  }

  const updateRoom = async (id: number, name: string) => {
    const room = await updateRoomRequest(id, name)
    setRooms((current) => current.map((item) => item.id === id ? room : item))
    return room
  }

  const deleteRoom = async (id: number) => {
    await deleteRoomRequest(id)
    setRooms((current) => current.filter((item) => item.id !== id))
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
        <Outlet context={{ profile, setProfile, rooms, addRoom, updateRoom, deleteRoom } satisfies LayoutContext} />
      </main>
    </div>
  )
}
