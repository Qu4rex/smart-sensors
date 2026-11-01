import { apiGet, apiPost } from './client'

export type StoredRoom = {
  id: number
  name: string
  created_at: string
}

export function listRooms(): Promise<StoredRoom[]> {
  return apiGet<StoredRoom[]>('/rooms')
}

export function createRoom(name: string): Promise<StoredRoom> {
  return apiPost<StoredRoom>('/rooms', { name })
}
