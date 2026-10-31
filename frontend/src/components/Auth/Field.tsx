import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'

import { EyeIcon, EyeOffIcon } from './icons'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  label: string
  icon: ReactNode
  value: string
  onChange: (value: string) => void
  /**пустая строка если значение корректно*/
  error: string
  submitted: boolean
  password?: boolean
  phone?: boolean
}

export default function Field({
  label,
  icon,
  value,
  onChange,
  error,
  submitted,
  password,
  phone,
  ...inputProps
}: FieldProps) {
  const id = useId()
  const [touched, setTouched] = useState(false)
  const [visible, setVisible] = useState(false)

  const shownError = touched || submitted ? error : ''

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>

      <div className={shownError ? 'field__box field__box--error' : 'field__box'}>
        <span className="field__icon">{icon}</span>

        <input
          id={id}
          className="field__input"
          type={password && !visible ? 'password' : phone ? 'tel' : 'text'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={Boolean(shownError)}
          aria-describedby={shownError ? `${id}-note` : undefined}
          {...inputProps}
        />

        {password && (
          <button
            type="button"
            className="field__eye"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>

      {shownError && (
        <p id={`${id}-note`} className="field__note">
          {shownError}
        </p>
      )}
    </div>
  )
}
