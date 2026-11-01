import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { apiGet } from '../../api/client'
import './notifications.css'

export type NotificationLevel = 'info' | 'warning' | 'critical'

export type AppNotification = {
  id: number
  time: string
  level: NotificationLevel
  title: string
  text: string
  source: string | null
}

type LocalNotification = {
  title: string
  text?: string
  level?: NotificationLevel
}

type Permission = NotificationPermission | 'unsupported'

type NotificationsContextValue = {
  notify: (n: LocalNotification) => void
  permission: Permission
  enableSystemNotifications: () => Promise<void>
}

type Toast = {
  key: number
  title: string
  text: string
  level: NotificationLevel
}

const POLL_INTERVAL_MS = 2000
/* true - системное уведомление только когда вкладка скрыта; false - всегда */
const SYSTEM_ONLY_WHEN_HIDDEN = false

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

function getPermission(): Permission {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

async function showSystemNotification(title: string, body: string, tag: string) {
  const options: NotificationOptions = { body, tag }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, options)
    else new Notification(title, options)
  } catch (error) {
    console.warn('[notifications] не удалось показать системное уведомление', error)
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [permission, setPermission] = useState<Permission>(getPermission)
  const lastId = useRef(0)
  const firstPoll = useRef(true)
  const toastKey = useRef(0)

  const dismiss = useCallback((key: number) => {
    setToasts((prev) => prev.filter((t) => t.key !== key))
  }, [])

  /* локальный тост */
  const notify = useCallback(
    (n: LocalNotification) => {
      const key = ++toastKey.current
      const level = n.level ?? 'info'
      setToasts((prev) => [...prev, { key, title: n.title, text: n.text ?? '', level }])
      window.setTimeout(() => dismiss(key), level === 'critical' ? 10000 : 5000)
    },
    [dismiss],
  )

  /* сервер. тост + системное */
  const showServerNotification = useCallback(
    (n: AppNotification) => {
      notify(n)
      const canUseSystem =
        getPermission() === 'granted' && (!SYSTEM_ONLY_WHEN_HIDDEN || document.hidden)
      if (canUseSystem) void showSystemNotification(n.title, n.text, String(n.id))
    },
    [notify],
  )

  /* опрос бэка */
  useEffect(() => {
    let stopped = false

    async function poll() {
      try {
        const items = await apiGet<AppNotification[]>(
          `/notifications?after_id=${lastId.current}`,
        )
        if (stopped) return
        for (const n of items) lastId.current = Math.max(lastId.current, n.id)
        if (firstPoll.current) {
          firstPoll.current = false
          return
        }
        items.forEach(showServerNotification)
      } catch {
        // бэкенд временно недоступен - попробуем на следующем опросе
      }
    }

    void poll()
    const timer = window.setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [showServerNotification])

  const enableSystemNotifications = useCallback(async () => {
    if (!('Notification' in window)) return
    setPermission(await Notification.requestPermission())
  }, [])

  return (
    <NotificationsContext.Provider
      value={{ notify, permission, enableSystemNotifications }}
    >
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div
            key={t.key}
            className={`toast toast--${t.level}`}
            role={t.level === 'critical' ? 'alert' : 'status'}
            onClick={() => dismiss(t.key)}
          >
            <strong>{t.title}</strong>
            {t.text && <span>{t.text}</span>}
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications нужно вызывать внутри NotificationsProvider')
  }
  return ctx
}

export function EnableNotificationsButton() {
  const { permission, enableSystemNotifications } = useNotifications()

  let hint: string
  if (permission === 'unsupported') {
    hint =
      'Браузер не поддерживает уведомления. Откройте сайт через localhost или https.'
  } else if (permission === 'denied') {
    hint =
      'Уведомления заблокированы. Нажмите на значок замка слева от адреса, разрешите «Уведомления» и обновите страницу. Также проверьте настройки уведомлений в самой ОС (Windows: «Не беспокоить» / Фокусировка внимания).'
  } else if (permission === 'granted') {
    hint = 'Уведомления браузера включены.'
  } else {
    hint = 'Браузер пока не разрешил показывать уведомления.'
  }

  return (
    <div className="settings__row">
      <div>
        <p className="settings__title">Уведомления браузера</p>
        <p className="settings__hint">{hint}</p>
      </div>

      {permission === 'default' && (
        <button type="button" onClick={() => void enableSystemNotifications()}>
          Включить
        </button>
      )}
      {permission === 'granted' && (
        <button
          type="button"
          onClick={() =>
            void showSystemNotification(
              'Тестовое уведомление',
              'Если вы это видите, уведомления браузера работают',
              `test-${Date.now()}`,
            )
          }
        >
          Проверить
        </button>
      )}
    </div>
  )
}