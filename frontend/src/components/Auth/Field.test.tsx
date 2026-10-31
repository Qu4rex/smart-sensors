import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import Field from './Field'

function renderField(props: { error?: string; submitted?: boolean; password?: boolean } = {}) {
  return render(
    <Field
      label="Логин"
      icon={<span />}
      value=""
      onChange={() => {}}
      error={props.error ?? ''}
      submitted={props.submitted ?? false}
      password={props.password}
    />,
  )
}

describe('Field', () => {
  it('не показывает ошибку, пока поле не тронули', () => {
    renderField({ error: 'Введите логин' })

    expect(screen.queryByText('Введите логин')).toBeNull()
  })

  it('показывает ошибку после ухода с поля', async () => {
    renderField({ error: 'Введите логин' })

    await userEvent.click(screen.getByLabelText('Логин'))
    await userEvent.tab()

    expect(screen.getByText('Введите логин')).toBeTruthy()
    expect(screen.getByLabelText('Логин').getAttribute('aria-invalid')).toBe('true')
  })

  it('показывает ошибку после отправки формы, даже если поле не трогали', () => {
    renderField({ error: 'Введите логин', submitted: true })

    expect(screen.getByText('Введите логин')).toBeTruthy()
  })

  it('кнопка-глаз переключает видимость пароля', async () => {
    renderField({ password: true })
    const input = screen.getByLabelText('Логин')
    expect(input.getAttribute('type')).toBe('password')

    await userEvent.click(screen.getByRole('button', { name: 'Показать пароль' }))

    expect(input.getAttribute('type')).toBe('text')
  })
})
