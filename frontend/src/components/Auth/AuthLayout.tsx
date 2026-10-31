import type { ReactNode } from 'react'

import logo from '../../assets/logo-dark.svg'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__bg" aria-hidden="true" />

      <main className="auth__card">
        <div className="auth__logo">
          <img src={logo} alt="" width={112} height={40} />
        </div>

        <h1 className="auth__title">Добро пожаловать</h1>
        <p className="auth__text">Система умного дома</p>

        {children}
      </main>
    </div>
  )
}
