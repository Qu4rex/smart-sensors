import { useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'

import type { LayoutContext } from '../components/Layout/Layout'
import { useTheme } from '../hooks/useTheme'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { userName, setUserName } = useOutletContext<LayoutContext>()
  const [firstName, setFirstName] = useState(userName === 'guest' ? '' : userName)
  const [lastName, setLastName] = useState(() => localStorage.getItem('user_last_name') || '')
  const [saved, setSaved] = useState(false)
  const isDark = theme === 'dark'

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = firstName.trim()
    if (!name) return

    setUserName(name)
    localStorage.setItem('user_last_name', lastName.trim())
    setSaved(true)
  }

  return (
    <section className="panel settings" aria-label="Настройки">
      <div className="settings__row">
        <div>
          <p className="settings__title">Тёмная тема</p>
          <p className="settings__hint">Меняет оформление всего приложения</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="Тёмная тема"
          className={isDark ? 'switch switch--on' : 'switch'}
          onClick={toggleTheme}
        >
          <span className="switch__thumb" />
        </button>
      </div>

      <form className="settings__form" onSubmit={handleSubmit}>
        <div>
          <h2 className="settings__title">Сменить имя пользователя</h2>
        </div>

        <div className="settings__fields">
          <label className="settings__field">
            <span>Имя</span>
            <input
              className="settings__input"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value)
                setSaved(false)
              }}
              autoComplete="given-name"
              required
            />
          </label>

          <label className="settings__field">
            <span>Фамилия</span>
            <input
              className="settings__input"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value)
                setSaved(false)
              }}
              autoComplete="family-name"
              required
            />
          </label>
        </div>

        <div className="settings__actions">
          <button type="submit" className="settings__save">
            Сохранить
          </button>
          {saved && <span className="settings__saved">Сохранено</span>}
        </div>
      </form>
    </section>
  )
}
