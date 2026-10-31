import type { ReactNode } from 'react'

type IconProps = {
  children: ReactNode
  size?: number
  strokeWidth?: number
}

/** шаблон для всех иконок */
export default function Icon({ children, size = 20, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}
