import { useCallback, useRef, useState } from 'react'

import { apiGet } from '../api/client'

export type DeviceSignal = {
  name: string
  title: string
  /** r – только чтение, w – только запись, rw – и то и другое */
  management: string
}

type DeviceInfo = {
  declaration: DeviceSignal[]
}

export type LoadStatus = 'loading' | 'ok' | 'error'

/**  лази лоад описания сигналов устройств и запоминает его. */
export function useDeviceDetails() {
  const [signals, setSignals] = useState<Record<string, DeviceSignal[]>>({})
  const [status, setStatus] = useState<Record<string, LoadStatus>>({})
  const requested = useRef<Set<string>>(new Set())

  const load = useCallback(async (device: string, force = false) => {
    if (!device || device === 'notification') return
    if (!force && requested.current.has(device)) return

    requested.current.add(device)
    setStatus((previous) => ({ ...previous, [device]: 'loading' }))

    try {
      const data = await apiGet<DeviceInfo>(`/devices/${encodeURIComponent(device)}`)

      setSignals((previous) => ({ ...previous, [device]: data.declaration ?? [] }))
      setStatus((previous) => ({ ...previous, [device]: 'ok' }))
    } catch {
      requested.current.delete(device)
      setStatus((previous) => ({ ...previous, [device]: 'error' }))
    }
  }, [])

  const signalTitle = useCallback(
    (device: string, signal: string) =>
      signals[device]?.find((item) => item.name === signal)?.title ?? signal,
    [signals],
  )

  return { signals, status, load, signalTitle }
}
