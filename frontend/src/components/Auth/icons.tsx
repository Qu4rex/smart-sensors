import Icon from '../icons/Icon'

export const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 19.5c.8-3.4 3.7-5.5 7-5.5s6.2 2.1 7 5.5" />
  </Icon>
)

export const LockIcon = () => (
  <Icon>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Icon>
)

export const EyeIcon = () => (
  <Icon>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const EyeOffIcon = () => (
  <Icon>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
    <path d="M4 4l16 16" />
  </Icon>
)
