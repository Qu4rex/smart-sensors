import { useTheme } from '../hooks/useTheme'
import { EnableNotificationsButton } from '../components/Notifications/NotificationsProvider'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

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
    </section>
  )
}
