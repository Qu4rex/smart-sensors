import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { loginRequest } from '../api/auth'
import AuthLayout from '../components/Auth/AuthLayout'
import Field from '../components/Auth/Field'
import { LockIcon, UserIcon } from '../components/Auth/icons'
import { saveToken } from '../utils/token'
import { formatPhone, validatePassword, validatePhone } from '../utils/validation'

export default function LoginPage() {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const phoneError = validatePhone(phone)
  const passwordError = validatePassword(password)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (phoneError || passwordError) return

    setLoading(true)
    setServerError('')

    try {
      const { access_token } = await loginRequest({ phone, password, remember })
      if (!access_token) throw new Error('Сервер не вернул токен')
      saveToken(access_token, remember)
      navigate('/page1', { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <Field
          label="Номер телефона"
          icon={<UserIcon />}
          phone
          value={phone}
          onChange={(value) => setPhone(formatPhone(value))}
          error={phoneError}
          submitted={submitted}
          placeholder="+7 (999) 999-99-99"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={18}
        />

        <Field
          label="Пароль"
          icon={<LockIcon />}
          password
          value={password}
          onChange={setPassword}
          error={passwordError}
          submitted={submitted}
          placeholder="Введите пароль"
          autoComplete="current-password"
          maxLength={18}
        />

        <label className="auth__check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          <span>Запомнить меня на 30 дней</span>
        </label>

        {serverError && (
          <p className="auth__error" role="alert">
            {serverError}
          </p>
        )}

        <div className="auth__actions">
          <button type="submit" className="auth__btn auth__btn--primary" disabled={loading}>
            {loading ? 'Входим…' : 'Войти'}
          </button>
          <Link to="/register" className="auth__btn auth__btn--secondary">
            У меня нет аккаунта
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
