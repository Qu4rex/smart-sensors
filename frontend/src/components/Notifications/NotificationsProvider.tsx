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
const SYSTEM_ONLY_WHEN_HIDDEN = true

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

function getPermission(): Permission {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

async function showSystemNotification(title: string, body: string, tag: string) {
  const options = { body, tag }
  const reg = await navigator.serviceWorker?.getRegistration()
  if (reg) await reg.showNotification(title, options)
  else new Notification(title, options)
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

export function EnableNotificationsButton({ className }: { className?: string }) {
  const { permission, enableSystemNotifications } = useNotifications()
  if (permission !== 'default') return null
  return (
    <button type="button" className={className} onClick={() => void enableSystemNotifications()}>
      Включить уведомления браузера
    </button>
  )
}
