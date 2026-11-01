import { afterEach, describe, expect, it } from 'vitest'

import { clearToken, getToken, isAuthenticated, isTokenValid, saveToken } from './token'

/** Собирает JWT-подобную строку с нужным exp (подпись для клиента не важна). */
function makeToken(expSecondsFromNow: number): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expSecondsFromNow }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `header.${payload}.signature`
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('saveToken / getToken / clearToken', () => {
  it('«запомнить меня» кладёт токен в localStorage', () => {
    saveToken('abc', true)

    expect(localStorage.getItem('access_token')).toBe('abc')
    expect(sessionStorage.getItem('access_token')).toBeNull()
    expect(getToken()).toBe('abc')
  })

  it('без «запомнить меня» токен живёт в sessionStorage', () => {
    saveToken('abc', false)

    expect(sessionStorage.getItem('access_token')).toBe('abc')
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('повторное сохранение не оставляет старый токен в другом хранилище', () => {
    saveToken('old', true)
    saveToken('new', false)

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(getToken()).toBe('new')
  })

  it('clearToken удаляет токен отовсюду', () => {
    saveToken('abc', true)
    clearToken()

    expect(getToken()).toBeNull()
  })
})

describe('isTokenValid', () => {
  it('принимает непросроченный токен', () => {
    expect(isTokenValid(makeToken(60))).toBe(true)
  })

  it('отклоняет просроченный токен', () => {
    expect(isTokenValid(makeToken(-60))).toBe(false)
  })

  it.each([null, '', 'not-a-jwt', 'a.%%%.c'])('отклоняет мусор: %j', (value) => {
    expect(isTokenValid(value)).toBe(false)
  })
})

describe('isAuthenticated', () => {
  it('true для живого токена', () => {
    saveToken(makeToken(60), false)

    expect(isAuthenticated()).toBe(true)
  })

  it('для просроченного токена возвращает false и удаляет его', () => {
    saveToken(makeToken(-60), true)

    expect(isAuthenticated()).toBe(false)
    expect(getToken()).toBeNull()
  })
})
