import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { registerRequest } from '../api/auth'
import AuthLayout from '../components/Auth/AuthLayout'
import Field from '../components/Auth/Field'
import { LockIcon, UserIcon } from '../components/Auth/icons'
import { formatPhone, validateConfirm, validatePassword, validatePhone } from '../utils/validation'

const SMS_CODE_LENGTH = 4

export default function RegisterPage() {
  const navigate = useNavigate()

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState<string[]>(() => Array(SMS_CODE_LENGTH).fill(''))
  const codeInputs = useRef<Array<HTMLInputElement | null>>([])
  const [step, setStep] = useState<'phone' | 'code' | 'password'>('phone')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const phoneError = validatePhone(phone)
  const passwordError = validatePassword(password)
  const confirmError = validateConfirm(password, confirm)

  const focusCodeInput = (index: number) => codeInputs.current[index]?.focus()

  const updateCode = (index: number, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, SMS_CODE_LENGTH - index).split('')
    setCode((current) => {
      const next = [...current]
      if (digits.length === 0) {
        next[index] = ''
      } else {
        digits.forEach((digit, digitIndex) => {
          next[index + digitIndex] = digit
        })
      }
      return next
    })
    setServerError('')

    if (digits.length > 0) focusCodeInput(Math.min(index + digits.length, SMS_CODE_LENGTH - 1))
  }

  const handleCodeKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      event.preventDefault()
      setCode((current) => {
        const next = [...current]
        next[index - 1] = ''
        return next
      })
      focusCodeInput(index - 1)
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusCodeInput(index - 1)
    }

    if (event.key === 'ArrowRight' && index < SMS_CODE_LENGTH - 1) {
      event.preventDefault()
      focusCodeInput(index + 1)
    }
  }

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
      if (code.join('') !== '1234') {
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
          <div className="sms-code">
            <label className="field__label" htmlFor="sms-code-0">
              Код из СМС
            </label>
            <div className={serverError ? 'sms-code__inputs sms-code__inputs--error' : 'sms-code__inputs'}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    codeInputs.current[index] = element
                  }}
                  id={`sms-code-${index}`}
                  className="sms-code__input"
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Цифра ${index + 1} кода из СМС`}
                  value={digit}
                  maxLength={SMS_CODE_LENGTH}
                  onChange={(event) => updateCode(index, event.target.value)}
                  onKeyDown={(event) => handleCodeKeyDown(event, index)}
                />
              ))}
            </div>
          </div>
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
