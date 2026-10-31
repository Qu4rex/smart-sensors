import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import Sidebar from '../Sidebar/Sidebar'

const SMALL_SCREEN = '(max-width: 900px)'

export default function Layout() {
  // на маленьких экранах панель по умолчанию свернута
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(SMALL_SCREEN).matches)

  const collapseOnSmallScreen = () => {
    if (window.matchMedia(SMALL_SCREEN).matches) setCollapsed(true)
  }

  return (
    <div className="layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onNavigate={collapseOnSmallScreen}
      />

      {!collapsed && <div className="backdrop" onClick={() => setCollapsed(true)} />}

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
