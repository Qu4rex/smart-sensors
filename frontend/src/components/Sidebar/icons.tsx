import Icon from '../icons/Icon'

export const FileIcon = () => (
  <Icon size={22}>
    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z" />
    <path d="M14 3.5V8h4M8.5 12.5h7M8.5 16h5" />
  </Icon>
)

export const ProfileIcon = () => (
  <Icon size={22}>
    <path d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </Icon>
)

export const SettingsIcon = () => (
  <Icon size={22}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Icon>
)

export const LogoutIcon = () => (
  <Icon size={22}>
    <path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14" />
    <path d="M15 12H5.5M9 8.5 5.5 12 9 15.5" />
  </Icon>
)

export const SidebarIcon = () => (
  <Icon size={24} strokeWidth={1.5}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <path d="M9.5 3.5v17M9.5 12h11" />
  </Icon>
)
