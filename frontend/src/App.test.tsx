import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { saveToken } from './utils/token'

/** JWT-подобный токен со сроком жизни час. */
function makeValidToken(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  return `header.${payload}.signature`
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('маршруты для гостя', () => {
  it('закрытая страница ведёт на вход', () => {
    renderAt('/page1')

    expect(screen.getByRole('heading', { name: 'Добро пожаловать' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Войти' })).toBeTruthy()
  })

  it('корень ведёт на вход', () => {
    renderAt('/')

    expect(screen.getByRole('button', { name: 'Войти' })).toBeTruthy()
  })

  it('неизвестный адрес тоже ведёт на вход', () => {
    renderAt('/no-such-page')

    expect(screen.getByRole('button', { name: 'Войти' })).toBeTruthy()
  })

  it('регистрация доступна без входа', () => {
    renderAt('/register')

    expect(screen.getByRole('button', { name: 'Далее' })).toBeTruthy()
  })
})

describe('маршруты для авторизованного', () => {
  it('вход и регистрация перенаправляют в приложение', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    saveToken(makeValidToken(), false)

    renderAt('/login')

    expect(screen.queryByRole('button', { name: 'Войти' })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('неизвестный адрес показывает страницу 404 внутри шаблона', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
    saveToken(makeValidToken(), false)

    renderAt('/no-such-page')

    expect(screen.getByRole('heading', { name: 'Страница не найдена' })).toBeTruthy()
    vi.unstubAllGlobals()
  })
})
