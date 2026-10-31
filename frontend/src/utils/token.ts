const TOKEN_KEY = 'access_token'

export function saveToken(token: string, remember: boolean) {
  clearToken()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

/**проверяет только срок действия из payload */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function isAuthenticated(): boolean {
  const token = getToken()
  if (!isTokenValid(token)) {
    clearToken()
    return false
  }
  return true
}
