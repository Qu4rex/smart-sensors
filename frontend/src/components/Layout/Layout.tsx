import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { meRequest } from '../../api/auth'
import Sidebar from '../Sidebar/Sidebar'

const SMALL_SCREEN = '(max-width: 900px)'

export type LayoutContext = {
  profile: {
    firstName: string
    secondName: string
  }
  setProfile: (profile: { firstName: string; secondName: string }) => void
}

export default function Layout() {
  // на маленьких экранах панель по умолчанию свернута
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(SMALL_SCREEN).matches)
  const [profile, setProfile] = useState({ firstName: 'guest', secondName: '' })

  useEffect(() => {
    meRequest()
      .then((user) => {
        setProfile({ firstName: user.first_name || 'guest', secondName: user.second_name || '' })
      })
      .catch(() => undefined)
  }, [])

  const collapseOnSmallScreen = () => {
    if (window.matchMedia(SMALL_SCREEN).matches) setCollapsed(true)
  }

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onNavigate={collapseOnSmallScreen}
        userName={profile.firstName}
      />

      {!collapsed && <div className="backdrop" onClick={() => setCollapsed(true)} />}

      <main className="content">
        <Outlet context={{ profile, setProfile } satisfies LayoutContext} />
      </main>
    </div>
  )
}
