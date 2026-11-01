import { apiDelete, apiGet, apiPatch, apiPost } from './client'

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

export function updateRoom(id: number, name: string): Promise<StoredRoom> {
  return apiPatch<StoredRoom>(`/rooms/${id}`, { name })
}

export function deleteRoom(id: number): Promise<void> {
  return apiDelete(`/rooms/${id}`)
}
