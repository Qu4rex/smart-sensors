import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

import { listDeviceTemplates, type DeviceTemplate } from '../api/devices'

type DeviceType = string

type Device = {
  id: number
  name: string
  template: DeviceTemplate
}

function DeviceIcon({ type }: { type: DeviceType }) {
  if (type === 'barrier') return <span className="device-icon device-icon--barrier" aria-hidden="true" />

  const paths: Record<string, ReactNode> = {
    barrier: null,
    thermostat: <><path d="M10 5a2 2 0 0 1 4 0v8.2a4 4 0 1 1-4 0V5z" /><path d="M12 9v7" /></>,
    counter: <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h1m3 0h1m3 0h1" /></>,
    light: <><path d="M8.5 17h7M9 20h6M8.3 14.5A6 6 0 1 1 15.7 14.5c-.8.8-1.2 1.5-1.2 2.5h-5c0-1-.4-1.7-1.2-2.5z" /><path d="M12 2V1m7.1 4.1.7-.7M4.2 4.4l.7.7" /></>,
    leak: <><path d="M12 3.5S6.5 10 6.5 14A5.5 5.5 0 0 0 17.5 14C17.5 10 12 3.5 12 3.5z" /><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" /></>,
    fire: <><path d="M12 21a6 6 0 0 0 5.6-8.1c-.9-2.1-2.8-3.8-5.2-6.9-.3 2.6-2.5 4-3.8 6.3A6.2 6.2 0 0 0 12 21z" /><path d="M12 18a2.2 2.2 0 0 0 1.8-3.5l-1.5-2.2c-.1 1.1-1.2 1.8-1.5 2.8A2.2 2.2 0 0 0 12 18z" /></>,
    ventilation: <><circle cx="12" cy="12" r="8" /><path d="M12 12c-1.6-3.8-4.6-4.5-5.3-2.7-.7 1.9 1.2 3.7 5.3 2.7zm0 0c4.1.1 5.6 2.8 4.2 4.1-1.4 1.4-3.9.1-4.2-4.1zm0 0c-2.5 3.2-1.4 6.1.5 5.9 2-.2 2.7-2.9-.5-5.9z" /></>,
    elevator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="m9 9 3-3 3 3M15 15l-3 3-3-3M8 12h8" /></>,
  }

  return <svg className="device-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type] ?? <rect x="4" y="4" width="16" height="16" rx="4" />}</svg>
}

function DeviceState({ type }: { type: DeviceType }) {
  if (type === 'barrier' || type === 'light') return <span className="device-card__switch"><span /></span>
  if (type === 'thermostat') return <span className="device-card__value">— <small>°C</small></span>
  if (type === 'counter') return <span className="device-card__value">0000</span>
  if (type === 'leak') return <span className="device-card__status">Отлично</span>
  return <span className="device-card__value">—</span>
}

export default function Page1() {
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceOptions, setDeviceOptions] = useState<DeviceTemplate[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [templatesError, setTemplatesError] = useState('')

  useEffect(() => {
    listDeviceTemplates()
      .then(setDeviceOptions)
      .catch(() => setTemplatesError('Не удалось загрузить шаблоны устройств'))
  }, [])

  const openAddDialog = () => {
    setSelectedTemplate(null)
    setDeviceName('')
    setIsAddOpen(true)
  }

  const addDevice = (event: FormEvent) => {
    event.preventDefault()
    if (!selectedTemplate || !deviceName.trim()) return
    setDevices((current) => [...current, { id: Date.now(), template: selectedTemplate, name: deviceName.trim() }])
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
              <div className="device-card__icon"><DeviceIcon type={device.template.key} /></div>
              <h2 className="device-card__name">{device.name}</h2>
              <DeviceState type={device.template.key} />
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
                  <button className={selectedTemplate?.key === option.key ? 'device-picker__item device-picker__item--selected' : 'device-picker__item'} key={option.key} type="button" onClick={() => setSelectedTemplate(option)}>
                    <DeviceIcon type={option.key} />
                    <span>{option.title}</span>
                  </button>
                ))}
              </div>
              {templatesError && <p className="device-modal__error">{templatesError}</p>}
              <label className="device-modal__field">
                <span>Название устройства</span>
                <input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="Например, лампа в спальне" maxLength={64} autoFocus />
              </label>
              <button className="device-modal__submit" type="submit" disabled={!selectedTemplate || !deviceName.trim()}>Добавить</button>
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
