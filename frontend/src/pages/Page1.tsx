import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'

import { createStoredDevice, getDeviceDetails, listDeviceTemplates, listStoredDevices, type DeviceDetails, type DeviceTemplate } from '../api/devices'
import type { LayoutContext } from '../components/Layout/Layout'

type DeviceType = string

type Device = {
  id: number
  name: string
  templateKey: string
  room: string | null
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

function DeviceState({ type, state }: { type: DeviceType; state: Record<string, unknown> }) {
  const value = (name: string) => state[name]
  const number = (name: string): number | string => {
    const signalValue = value(name)
    return typeof signalValue === 'number' ? signalValue : '—'
  }

  if (type === 'barrier') {
    const states: Record<number, string> = { 0: 'Закрыто', 1: 'Открывается', 2: 'Открыто', 3: 'Закрывается', 4: 'Удержание' }
    return <span className="device-card__status">{states[Number(value('state'))] ?? '—'}</span>
  }
  if (type === 'light') return <span className="device-card__status">{Number(value('lamp')) === 1 ? 'Включен' : 'Выключен'}</span>
  if (type === 'thermostat') return <span className="device-card__value">{number('temperature')} <small>°C</small></span>
  if (type === 'counter') return <span className="device-card__value">{number('total')}</span>
  if (type === 'leak') return <span className={Number(value('leak')) === 1 ? 'device-card__status device-card__status--alert' : 'device-card__status'}>{Number(value('leak')) === 1 ? 'Протечка' : 'Отлично'}</span>
  if (type === 'elevator') return <span className="device-card__value">{number('floor_current')} <small>этаж</small></span>
  if (type === 'ventilation') return <span className="device-card__value">{number('co2')} <small>ppm</small></span>
  if (type === 'fire') return <span className="device-card__value">{number('smoke')} <small>%</small></span>
  return <span className="device-card__value">—</span>
}

export default function Page1() {
  const { rooms, addRoom } = useOutletContext<LayoutContext>()
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceOptions, setDeviceOptions] = useState<DeviceTemplate[]>([])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [deviceRoom, setDeviceRoom] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetails | null>(null)
  const [detailsError, setDetailsError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [templatesError, setTemplatesError] = useState('')
  const [activeRoom, setActiveRoom] = useState<number | 'all'>('all')
  const [isRoomOpen, setIsRoomOpen] = useState(false)
  const [roomName, setRoomName] = useState('')

  useEffect(() => {
    const loadTemplates = () => {
      listDeviceTemplates()
        .then((templates) => {
          setDeviceOptions(templates)
          setTemplatesError('')
        })
        .catch(() => setTemplatesError('Не удалось загрузить шаблоны устройств'))
    }

    loadTemplates()
    const interval = window.setInterval(loadTemplates, 3000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    listStoredDevices()
      .then((storedDevices) => {
        setDevices(storedDevices.map((device) => ({
          id: device.id,
          name: device.name,
          templateKey: device.device_type,
          room: device.room,
        })))
      })
      .catch(() => undefined)
  }, [])

  const openAddDialog = () => {
    setSelectedTemplate(null)
    setDeviceName('')
    setDeviceRoom(activeRoom === 'all' ? '' : rooms.find((room) => room.id === activeRoom)?.name || '')
    setIsAddOpen(true)
  }

  const addDevice = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedTemplate || !deviceName.trim()) return
    const storedDevice = await createStoredDevice({
      name: deviceName.trim(),
      device_type: selectedTemplate.key,
      room: deviceRoom || null,
    })
    setDevices((current) => [...current, {
      id: storedDevice.id,
      name: storedDevice.name,
      templateKey: storedDevice.device_type,
      room: storedDevice.room,
    }])
    setIsAddOpen(false)
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 3000)
  }

  const createRoom = async (event: FormEvent) => {
    event.preventDefault()
    const name = roomName.trim()
    if (!name) return
    try {
      const room = await addRoom(name)
      setActiveRoom(room.id)
      setRoomName('')
      setIsRoomOpen(false)
    } catch {
      setTemplatesError('Не удалось сохранить комнату')
    }
  }

  const loadDeviceDetails = (device: Device) => {
    setDeviceDetails(null)
    setDetailsError('')
    getDeviceDetails(device.templateKey)
      .then(setDeviceDetails)
      .catch(() => setDetailsError('Не удалось загрузить данные устройства'))
  }

  const openDeviceDetails = (device: Device) => {
    setSelectedDevice(device)
    loadDeviceDetails(device)
  }

  const closeDeviceDetails = () => {
    setSelectedDevice(null)
    setDeviceDetails(null)
    setDetailsError('')
  }

  const selectedRoom = activeRoom === 'all' ? null : rooms.find((room) => room.id === activeRoom)
  const visibleDevices = selectedRoom
    ? devices.filter((device) => device.room === selectedRoom.name)
    : devices

  const formatSignalValue = (signal: NonNullable<DeviceDetails>['declaration'][number]) => {
    if (!deviceDetails) return ''
    const value = deviceDetails.state[signal.name]
    const label = signal.layout?.[String(value)]
    if (label) return label
    return signal.measure ? `${String(value)} ${signal.measure}` : String(value)
  }

  return (
    <section className="panel panel--with-add devices-panel" aria-label="Устройства">
      <nav className="room-tabs" aria-label="Комнаты устройств">
        <button className={activeRoom === 'all' ? 'room-tabs__item room-tabs__item--active' : 'room-tabs__item'} type="button" onClick={() => setActiveRoom('all')}>Все устройства</button>
        {rooms.map((room) => (
          <button className={activeRoom === room.id ? 'room-tabs__item room-tabs__item--active' : 'room-tabs__item'} key={room.id} type="button" onClick={() => setActiveRoom(room.id)}>{room.name}</button>
        ))}
        <button className="room-tabs__add" type="button" aria-label="Добавить комнату" onClick={() => setIsRoomOpen(true)}>+</button>
      </nav>

      {visibleDevices.length === 0 ? <p className="panel__text devices-panel__empty">Нет добавленных устройств</p> : (
        <div className="device-grid">
          {visibleDevices.map((device) => {
            const template = deviceOptions.find(({ key }) => key === device.templateKey)
            if (!template) return null
            return (
              <article className="device-card" key={device.id}>
                <div className="device-card__icon"><DeviceIcon type={template.key} /></div>
                <h2 className="device-card__name">{device.name}</h2>
                <DeviceState type={template.key} state={template.state} />
                <button className="device-card__details" type="button" aria-label={`Открыть ${device.name}`} onClick={() => openDeviceDetails(device)}>↘</button>
              </article>
            )
          })}
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
              <label className="device-modal__field">
                <span>Комната</span>
                <select value={deviceRoom} onChange={(event) => setDeviceRoom(event.target.value)}>
                  <option value="">Не выбрана</option>
                  {rooms.map((room) => <option key={room.id} value={room.name}>{room.name}</option>)}
                </select>
              </label>
              <button className="device-modal__submit" type="submit" disabled={!selectedTemplate || !deviceName.trim()}>Добавить</button>
            </form>
          </section>
        </div>
      )}

      {isRoomOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsRoomOpen(false)}>
          <section className="device-modal device-modal--compact" role="dialog" aria-modal="true" aria-labelledby="add-room-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="add-room-title">Добавить комнату</h1>
              <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={() => setIsRoomOpen(false)}>×</button>
            </div>
            <form onSubmit={createRoom}>
              <label className="device-modal__field device-modal__field--first">
                <span>Название комнаты</span>
                <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Например, гостиная" maxLength={64} autoFocus />
              </label>
              <button className="device-modal__submit" type="submit" disabled={!roomName.trim()}>Добавить</button>
            </form>
          </section>
        </div>
      )}

      {selectedDevice && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeDeviceDetails}>
          <section className="device-modal device-modal--details" role="dialog" aria-modal="true" aria-labelledby="device-details-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="device-details-title">{selectedDevice.name}</h1>
              <div className="device-modal__actions">
                <button type="button" className="device-modal__refresh" aria-label="Обновить данные" onClick={() => loadDeviceDetails(selectedDevice)}>↻</button>
                <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={closeDeviceDetails}>×</button>
              </div>
            </div>
            {deviceDetails && <p className="device-modal__subtitle">{deviceDetails.title}</p>}
            {detailsError && <p className="device-modal__error">{detailsError}</p>}
            {!deviceDetails && !detailsError && <p className="device-modal__loading">Загружаем данные…</p>}
            {deviceDetails && (
              <dl className="device-details">
                {deviceDetails.declaration.filter((signal) => signal.name !== 'fw').map((signal) => (
                  <div className="device-details__row" key={signal.name}>
                    <dt>{signal.title}</dt>
                    <dd>{formatSignalValue(signal)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      )}

      {showToast && <div className="device-toast" role="status">Устройство добавлено</div>}
    </section>
  )
}
