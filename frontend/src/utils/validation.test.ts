import { describe, expect, it } from 'vitest'

import { formatPhone, toBackendLogin, validateConfirm, validatePassword, validatePhone } from './validation'

describe('validatePhone', () => {
  it('принимает номер в маске', () => {
    expect(validatePhone('+7 (999) 123-45-67')).toBe('')
    expect(formatPhone('89991234567')).toBe('+7 (999) 123-45-67')
    expect(toBackendLogin('+7 (999) 123-45-67')).toBe('+79991234567')
  })

  it.each([
    ['', 'Введите номер телефона'],
    ['+7 (999) 123-45', 'Введите номер в формате +7 (999) 999-99-99'],
    ['+7 (999) 123-45-6x', 'Введите номер в формате +7 (999) 999-99-99'],
  ])('отклоняет %j', (value, message) => {
    expect(validatePhone(value)).toBe(message)
  })
})

describe('validatePassword', () => {
  it('принимает латиницу, цифры и символы', () => {
    expect(validatePassword('Passw0rd!x')).toBe('')
  })

  it.each([
    ['', 'Введите пароль'],
    ['short1!', 'Пароль должен быть от 8 до 18 символов'],
    ['a'.repeat(19), 'Пароль должен быть от 8 до 18 символов'],
    ['pass word 123', 'Только латинские буквы, цифры и символы, без пробелов'],
    ['парольпароль1', 'Только латинские буквы, цифры и символы, без пробелов'],
  ])('отклоняет %j', (value, message) => {
    expect(validatePassword(value)).toBe(message)
  })
})

describe('validateConfirm', () => {
  it('требует повторить пароль', () => {
    expect(validateConfirm('Passw0rd!x', '')).toBe('Повторите пароль')
  })

  it('сравнивает пароли', () => {
    expect(validateConfirm('Passw0rd!x', 'other')).toBe('Пароли не совпадают')
    expect(validateConfirm('Passw0rd!x', 'Passw0rd!x')).toBe('')
  })
})
