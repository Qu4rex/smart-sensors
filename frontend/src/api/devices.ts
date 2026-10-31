import { apiGet } from './client'

type DevicesResponse = Record<string, { title: string; state: Record<string, unknown> }>

export type DeviceTemplate = {
  key: string
  title: string
}

export async function listDeviceTemplates(): Promise<DeviceTemplate[]> {
  const devices = await apiGet<DevicesResponse>('/devices')
  return Object.entries(devices).map(([key, device]) => ({ key, title: device.title }))
}
