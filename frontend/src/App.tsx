import { Navigate, Route, Routes } from 'react-router-dom'

import GuestOnly from './components/Auth/GuestOnly'
import RequireAuth from './components/Auth/RequireAuth'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import Page1 from './pages/Page1'
import Page2 from './pages/Page2'
import Page4 from './pages/Page4'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import ScenariosPage from './pages/ScenariosPage'

export default function App() {
  return (
    <Routes>
      {/* Страницы без боковой панели: только для гостей */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Всё остальное: только для авторизованных, внутри основного шаблона */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/page1" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<ScenariosPage />} />
          <Route path="/scenarios" element={<Navigate to="/page3" replace />} />
          <Route path="/page4" element={<Page4 />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
