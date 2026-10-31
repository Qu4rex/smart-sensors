import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { logoutRequest } from '../../api/auth'
import logoOnDark from '../../assets/logo-light.svg'
import logoOnLight from '../../assets/logo-dark.svg'
import { clearToken } from '../../utils/token'
import { FileIcon, LogoutIcon, ProfileIcon, SettingsIcon, SidebarIcon, EmulationIcon, DeviceIcon } from './icons'
import LogoutDialog from './LogoutDialog'

const pages = [
  { to: '/page1', label: 'Устройства', icon: <DeviceIcon /> },
  { to: '/page2', label: 'Эмуляция', icon: <EmulationIcon /> },
  { to: '/page3', label: 'Сценарии', icon: <FileIcon /> }
]

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
  onNavigate: () => void
  userName: string
}
const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'menu__item menu__item--active' : 'menu__item'

export default function Sidebar({ collapsed, onToggle, onNavigate, userName }: SidebarProps) {
  const [logoutOpen, setLogoutOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logoutRequest().catch(() => undefined)
    clearToken()
    setLogoutOpen(false)
    navigate('/login', { replace: true })
  }
  return (
    <aside className={collapsed ? 'sidebar sidebar--collapsed' : 'sidebar'}>
      <div className="sidebar__top">
        <div className="logo">
          <img className="logo__img--on-light" src={logoOnLight} alt="" width={112} height={40} />
          <img className="logo__img--on-dark" src={logoOnDark} alt="" width={112} height={40} />
        </div>

        <button
          type="button"
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Развернуть панель' : 'Свернуть панель'}
          aria-expanded={!collapsed}
        >
          <SidebarIcon />
        </button>
      </div>

      <nav className="menu" aria-label="Основная навигация">
        {pages.map((page) => (
          <NavLink
            key={page.to}
            to={page.to}
            className={linkClass}
            title={page.label}
            onClick={onNavigate}
          >
            {page.icon}
            <span className="menu__label">{page.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__bottom">
        <hr className="sidebar__line" />

        <NavLink to="/settings" className={linkClass} title="Настройки" onClick={onNavigate}>
          <SettingsIcon />
          <span className="menu__label">Настройки</span>
        </NavLink>

        <div className="profile">
          <div className="profile__info" title={userName}>
            <ProfileIcon />
            <span className="profile__name">{userName}</span>
          </div>

          <button
            type="button"
            className="profile__logout"
            title="Выйти"
            aria-label="Выйти"
            onClick={() => setLogoutOpen(true)}
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
      <LogoutDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </aside>
  )
}
