import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { saveToken } from '../utils/token'
import { apiGet, apiPost } from './client'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const assign = vi.fn()

beforeEach(() => {
  vi.stubGlobal('location', { assign })
})

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
  sessionStorage.clear()
  assign.mockClear()
})

describe('запросы', () => {
  it('GET идёт на /api/v1 и возвращает JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiGet('/auth/me')).resolves.toEqual({ id: 1 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/me',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('POST отправляет тело как JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await apiPost('/auth/login', { login: 'tester1' })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBe('{"login":"tester1"}')
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('добавляет Bearer-токен, если он есть', async () => {
    saveToken('abc', false)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    vi.stubGlobal('fetch', fetchMock)

    await apiGet('/auth/me')

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  it('ответ 204 даёт undefined', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(apiPost('/auth/logout')).resolves.toBeUndefined()
  })
})

describe('ошибки', () => {
  it('показывает detail из ответа сервера (и для GET, и для POST)', async () => {
    const body = { detail: 'Неверный логин или пароль' }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => jsonResponse(body, 401)),
    )

    await expect(apiPost('/auth/login', {})).rejects.toThrow('Неверный логин или пароль')
    await expect(apiGet('/auth/me')).rejects.toThrow('Неверный логин или пароль')
  })

  it('без detail сообщает код ответа', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })))

    await expect(apiGet('/x')).rejects.toThrow('API error: 500')
  })

  it.each([502, 503, 504])('для %i говорит, что сервер недоступен', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))

    await expect(apiGet('/x')).rejects.toThrow('Не удалось связаться с сервером')
  })

  it('сетевая ошибка превращается в понятное сообщение', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(apiPost('/x')).rejects.toThrow('Не удалось связаться с сервером')
    await expect(apiGet('/x')).rejects.toThrow('Не удалось связаться с сервером')
  })
})

describe('401', () => {
  it('с токеном: сбрасывает токен и отправляет на /login', async () => {
    saveToken('expired', true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'x' }, 401)))

    await expect(apiGet('/auth/me')).rejects.toThrow()

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('без токена (неверный пароль при входе): не перезагружает страницу', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Неверный' }, 401)))

    await expect(apiPost('/auth/login', {})).rejects.toThrow('Неверный')

    expect(assign).not.toHaveBeenCalled()
  })
})
