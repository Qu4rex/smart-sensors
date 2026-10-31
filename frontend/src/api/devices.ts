import { apiGet } from './client'

type DevicesResponse = Record<string, { title: string; state: Record<string, unknown> }>

export type DeviceTemplate = {
  key: string
  title: string
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

export async function listDeviceTemplates(): Promise<DeviceTemplate[]> {
  const devices = await apiGet<DevicesResponse>('/devices')
  return Object.entries(devices).map(([key, device]) => ({ key, title: device.title }))
}

export function getDeviceDetails(key: string): Promise<DeviceDetails> {
  return apiGet<DeviceDetails>(`/devices/${key}`)
}
