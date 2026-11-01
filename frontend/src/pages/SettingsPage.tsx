import { useState, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'

import { updateProfileRequest } from '../api/auth'
import type { LayoutContext, UserProfile } from '../components/Layout/Layout'
import { useTheme } from '../hooks/useTheme'
import { EnableNotificationsButton } from '../components/Notifications/NotificationsProvider'

export default function SettingsPage() {
  const { profile, setProfile } = useOutletContext<LayoutContext>()

  if (!profile) return <section className="panel settings" aria-label="Настройки" />

  return <SettingsForm profile={profile} setProfile={setProfile} />
}

type SettingsFormProps = {
  profile: UserProfile
  setProfile: LayoutContext['setProfile']
}

function SettingsForm({ profile, setProfile }: SettingsFormProps) {
  const { theme, toggleTheme } = useTheme()
  const [firstName, setFirstName] = useState(profile.firstName === 'guest' ? '' : profile.firstName)
  const [lastName, setLastName] = useState(profile.secondName)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const isDark = theme === 'dark'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    if (!trimmedFirstName || !trimmedLastName) return

    setSaving(true)
    setSaved(false)
    setServerError('')
    try {
      const user = await updateProfileRequest({
        first_name: trimmedFirstName,
        second_name: trimmedLastName,
      })
      setProfile({ firstName: user.first_name || 'guest', secondName: user.second_name || '' })
      setSaved(true)
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Не удалось сохранить имя')
    } finally {
      setSaving(false)
    }
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
        <EnableNotificationsButton />

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
              minLength={3}
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
              minLength={3}
              required
            />
          </label>
        </div>

        <div className="settings__actions">
          <button type="submit" className="settings__save" disabled={saving}>
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
          {saved && <span className="settings__saved">Сохранено</span>}
        </div>
        {serverError && <p className="settings__error">{serverError}</p>}
      </form>
    </section>
  )
}
