import { Navigate, Outlet } from 'react-router-dom'

import { isAuthenticated } from '../../utils/token'

/** Страницы для гостей (вход, регистрация): авторизованных отправляет в приложение. */
export default function GuestOnly() {
  if (isAuthenticated()) {
    return <Navigate to="/page1" replace />
  }
  return <Outlet />
}
