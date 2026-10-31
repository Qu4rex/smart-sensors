import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { registerRequest } from '../api/auth'
import AuthLayout from '../components/Auth/AuthLayout'
import Field from '../components/Auth/Field'
import { LockIcon, UserIcon } from '../components/Auth/icons'
import { formatPhone, validateConfirm, validatePassword, validatePhone } from '../utils/validation'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const phoneError = validatePhone(phone)
  const passwordError = validatePassword(password)
  const confirmError = validateConfirm(password, confirm)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (step === 'phone') {
      if (phoneError) return
      setStep('code')
      setSubmitted(false)
      return
    }

    if (step === 'code') {
      if (code !== '1234') {
        setServerError('Неверный код из СМС')
        return
      }
      setServerError('')
      setStep('password')
      setSubmitted(false)
      return
    }

    if (passwordError || confirmError) return

    setLoading(true)
    setServerError('')

    try {
      await registerRequest({ phone, password })
      navigate('/login', { replace: true })
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Не удалось зарегистрироваться')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {step === 'phone' && (
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
        )}

        {step === 'code' && (
          <Field
            label="Код из СМС"
            icon={<UserIcon />}
            value={code}
            onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 4))}
            error={code && code !== '1234' ? 'Неверный код из СМС' : ''}
            submitted={submitted}
            placeholder="Введите код из СМС"
            inputMode="numeric"
            maxLength={4}
            autoComplete="one-time-code"
          />
        )}

        {step === 'password' && (
          <>
            <Field
              label="Пароль"
              icon={<LockIcon />}
              password
              value={password}
              onChange={setPassword}
              error={passwordError}
              submitted={submitted}
              placeholder="Придумайте пароль"
              autoComplete="new-password"
              maxLength={18}
            />

            <Field
              label="Повторите пароль"
              icon={<LockIcon />}
              password
              value={confirm}
              onChange={setConfirm}
              error={confirmError}
              submitted={submitted}
              placeholder="Повторите пароль"
              autoComplete="new-password"
              maxLength={18}
            />
          </>
        )}

        {serverError && (
          <p className="auth__error" role="alert">
            {serverError}
          </p>
        )}

        <div className="auth__actions">
          <button type="submit" className="auth__btn auth__btn--primary" disabled={loading}>
            {loading
              ? 'Создаём аккаунт…'
              : step === 'phone'
                ? 'Далее'
                : step === 'code'
                  ? 'Подтвердить'
                  : 'Зарегистрироваться'}
          </button>
          <Link to="/login" className="auth__btn auth__btn--secondary">
            У меня уже есть аккаунт
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
