import { apiGet, apiPost } from './client'

export type LoginPayload = {
  login: string
  password: string
  remember: boolean
}

export type RegisterPayload = {
  login: string
  password: string
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type UserInfo = {
  id: number
  login: string
  is_active: boolean
  created_at: string
}

export function loginRequest(data: LoginPayload) {
  return apiPost<TokenResponse>('/auth/login', data)
}

export function registerRequest(data: RegisterPayload) {
  return apiPost<UserInfo>('/auth/register', data)
}

export function logoutRequest() {
  return apiPost<void>('/auth/logout')
}

export function meRequest() {
  return apiGet<UserInfo>('/auth/me')
}
