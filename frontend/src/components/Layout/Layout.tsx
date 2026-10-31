import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from '../Sidebar/Sidebar'

const SMALL_SCREEN = '(max-width: 900px)'
const USER_NAME_KEY = 'user_name'

export type LayoutContext = {
  userName: string
  setUserName: (name: string) => void
}

export default function Layout() {
  // на маленьких экранах панель по умолчанию свернута
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(SMALL_SCREEN).matches)
  const [userName, setUserName] = useState(() => localStorage.getItem(USER_NAME_KEY) || 'guest')

  const collapseOnSmallScreen = () => {
    if (window.matchMedia(SMALL_SCREEN).matches) setCollapsed(true)
  }

  const updateUserName = (name: string) => {
    localStorage.setItem(USER_NAME_KEY, name)
    setUserName(name)
  }

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onNavigate={collapseOnSmallScreen}
        userName={userName}
      />

      {!collapsed && <div className="backdrop" onClick={() => setCollapsed(true)} />}

      <main className="content">
        <Outlet context={{ userName, setUserName: updateUserName } satisfies LayoutContext} />
      </main>
    </div>
  )
}
