import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { isAuthenticated } from '../../utils/token'

/** Пускает дальше только авторизованных, остальных отправляет на /login. */
export default function RequireAuth() {
  const location = useLocation()

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
