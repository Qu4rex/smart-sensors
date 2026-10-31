import { clearToken, getToken } from '../utils/token'
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

const NETWORK_ERROR = 'Не удалось связаться с сервером'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

/**токен, ошибки сети, 401 и разбор ответа*/
async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error instanceof TypeError) throw new Error(NETWORK_ERROR, { cause: error })
    throw error
  }

  if ([502, 503, 504].includes(response.status)) {
    throw new Error(NETWORK_ERROR)
  }

  // 401 с токеном: он просрочен или отозван, возвращаем пользователя на вход.
  // Без токена (неверный пароль при входе) ничего не сбрасываем, а показываем ошибку сервера.
  if (response.status === 401 && token) {
    clearToken()
    window.location.assign('/login')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(
      typeof data?.detail === 'string' ? data.detail : `API error: ${response.status}`,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body)
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body)
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path)
}
