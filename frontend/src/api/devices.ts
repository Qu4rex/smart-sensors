import { apiDelete, apiGet, apiPatch, apiPost } from './client'

type DevicesResponse = Record<string, { title: string; state: Record<string, unknown> }>

export type DeviceTemplate = {
  key: string
  title: string
  state: Record<string, unknown>
}

type SignalDeclaration = {
  name: string
  title: string
  measure?: string
  layout?: Record<string, string>
}

export type DeviceDetails = {
  title: string
  state: Record<string, unknown>
  declaration: SignalDeclaration[]
}

export type StoredDevice = {
  id: number
  serial: string
  name: string
  device_type: string
  room: string | null
  created_at: string
}

export async function listDeviceTemplates(): Promise<DeviceTemplate[]> {
  const devices = await apiGet<DevicesResponse>('/devices')
  return Object.entries(devices).map(([key, device]) => ({ key, title: device.title, state: device.state }))
}

export function getDeviceDetails(key: string): Promise<DeviceDetails> {
  return apiGet<DeviceDetails>(`/devices/${key}`)
}

export function listStoredDevices(): Promise<StoredDevice[]> {
  return apiGet<StoredDevice[]>('/devices/stored')
}

export function createStoredDevice(data: Pick<StoredDevice, 'name' | 'device_type' | 'room'>): Promise<StoredDevice> {
  return apiPost<StoredDevice>('/devices/stored', data)
}

export function updateStoredDevice(id: number, data: Pick<StoredDevice, 'name' | 'room'>): Promise<StoredDevice> {
  return apiPatch<StoredDevice>(`/devices/stored/${id}`, data)
}

export function deleteStoredDevice(id: number): Promise<void> {
  return apiDelete(`/devices/stored/${id}`)
}
