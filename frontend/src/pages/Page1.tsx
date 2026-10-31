import { useState, type FormEvent, type ReactNode } from 'react'

type DeviceType = 'barrier' | 'thermostat' | 'meter' | 'lamp' | 'leak'

type Device = {
  id: number
  name: string
  type: DeviceType
}

const deviceOptions: Array<{ type: DeviceType; label: string }> = [
  { type: 'barrier', label: 'Шлагбаум' },
  { type: 'thermostat', label: 'Термостат' },
  { type: 'meter', label: 'Счётчик' },
  { type: 'lamp', label: 'Лампа' },
  { type: 'leak', label: 'Датчик протечки' },
]

function DeviceIcon({ type }: { type: DeviceType }) {
  if (type === 'barrier') return <span className="device-icon device-icon--barrier" aria-hidden="true" />

  const paths: Record<DeviceType, ReactNode> = {
    barrier: null,
    thermostat: <><path d="M10 5a2 2 0 0 1 4 0v8.2a4 4 0 1 1-4 0V5z" /><path d="M12 9v7" /></>,
    meter: <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h1m3 0h1m3 0h1" /></>,
    lamp: <><path d="M8.5 17h7M9 20h6M8.3 14.5A6 6 0 1 1 15.7 14.5c-.8.8-1.2 1.5-1.2 2.5h-5c0-1-.4-1.7-1.2-2.5z" /><path d="M12 2V1m7.1 4.1.7-.7M4.2 4.4l.7.7" /></>,
    leak: <><path d="M12 3.5S6.5 10 6.5 14A5.5 5.5 0 0 0 17.5 14C17.5 10 12 3.5 12 3.5z" /><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" /></>,
  }

  return <svg className="device-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>
}

function DeviceState({ type }: { type: DeviceType }) {
  if (type === 'barrier' || type === 'lamp') return <span className="device-card__switch"><span /></span>
  if (type === 'thermostat') return <span className="device-card__value">— <small>°C</small></span>
  if (type === 'meter') return <span className="device-card__value">0000</span>
  return <span className="device-card__status">Отлично</span>
}

export default function Page1() {
  const [devices, setDevices] = useState<Device[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<DeviceType | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showToast, setShowToast] = useState(false)

  const openAddDialog = () => {
    setSelectedType(null)
    setDeviceName('')
    setIsAddOpen(true)
  }

  const addDevice = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedType || !deviceName.trim()) return
    setDevices((current) => [...current, { id: Date.now(), type: selectedType, name: deviceName.trim() }])
    setIsAddOpen(false)
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <section className="panel panel--with-add devices-panel" aria-label="Устройства">
      {devices.length === 0 ? <p className="panel__text devices-panel__empty">Нет добавленных устройств</p> : (
        <div className="device-grid">
          {devices.map((device) => (
            <article className="device-card" key={device.id}>
              <div className="device-card__icon"><DeviceIcon type={device.type} /></div>
              <h2 className="device-card__name">{device.name}</h2>
              <DeviceState type={device.type} />
              <button className="device-card__details" type="button" aria-label={`Открыть ${device.name}`} onClick={() => setSelectedDevice(device)}>↗</button>
            </article>
          ))}
        </div>
      )}

      <button className="panel__add" type="button" aria-label="Добавить устройство" onClick={openAddDialog}>+</button>

      {isAddOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsAddOpen(false)}>
          <section className="device-modal" role="dialog" aria-modal="true" aria-labelledby="add-device-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="add-device-title">Добавить устройство</h1>
              <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={() => setIsAddOpen(false)}>×</button>
            </div>
            <form onSubmit={addDevice}>
              <div className="device-picker" aria-label="Тип устройства">
                {deviceOptions.map((option) => (
                  <button className={selectedType === option.type ? 'device-picker__item device-picker__item--selected' : 'device-picker__item'} key={option.type} type="button" onClick={() => setSelectedType(option.type)}>
                    <DeviceIcon type={option.type} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              <label className="device-modal__field">
                <span>Название устройства</span>
                <input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="Например, лампа в спальне" maxLength={64} autoFocus />
              </label>
              <button className="device-modal__submit" type="submit" disabled={!selectedType || !deviceName.trim()}>Добавить</button>
            </form>
          </section>
        </div>
      )}

      {selectedDevice && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedDevice(null)}>
          <section className="device-modal device-modal--details" role="dialog" aria-modal="true" aria-labelledby="device-details-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="device-details-title">{selectedDevice.name}</h1>
              <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={() => setSelectedDevice(null)}>×</button>
            </div>
          </section>
        </div>
      )}

      {showToast && <div className="device-toast" role="status">Устройство добавлено</div>}
    </section>
  )
}
