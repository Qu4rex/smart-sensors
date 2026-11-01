import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'

import { createStoredDevice, deleteStoredDevice, getDeviceDetails, listDeviceTemplates, listStoredDevices, sendDeviceCommand, updateStoredDevice, type DeviceDetails, type DeviceTemplate } from '../api/devices'
import barrierImage from '../assets/barrier.png'
import counterImage from '../assets/counter.png'
import elevatorImage from '../assets/elevator.png'
import fireImage from '../assets/fire.png'
import leakImage from '../assets/leak.png'
import lightImage from '../assets/light.png'
import thermostatImage from '../assets/thermostat.png'
import ventilationImage from '../assets/ventilation.png'
import type { LayoutContext } from '../components/Layout/Layout'

type DeviceType = string

type Device = {
  id: number
  name: string
  templateKey: string
  room: string | null
}

const deviceImages: Record<string, string> = {
  barrier: barrierImage,
  thermostat: thermostatImage,
  counter: counterImage,
  light: lightImage,
  leak: leakImage,
  fire: fireImage,
  ventilation: ventilationImage,
  elevator: elevatorImage,
}

const hiddenDetailSignals: Record<string, Set<string>> = {
  leak: new Set(['self_test']),
  fire: new Set(['self_test']),
  elevator: new Set(['floor_changed', 'emergency_btn']),
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
  if (type === 'leak') return <span className={Number(value('leak')) === 1 ? 'device-card__status device-card__status--alert' : 'device-card__status'}>{Number(value('leak')) === 1 ? 'Протечка' : 'Протечки нет'}</span>
  if (type === 'elevator') return <span className="device-card__value">{number('floor_current')} <small>этаж</small></span>
  if (type === 'ventilation') return <span className="device-card__value">{number('co2')} <small>ppm</small></span>
  if (type === 'fire') return <span className="device-card__value">{number('smoke')} <small>%</small></span>
  return <span className="device-card__value">—</span>
}

function DeviceSwitch({ type, state, onToggle }: { type: string; state: Record<string, unknown>; onToggle: () => void }) {
  const isOn = type === 'light' ? Number(state.lamp) === 1 : Number(state.state) !== 0
  const label = type === 'light' ? (isOn ? 'Выключить светильник' : 'Включить светильник') : (isOn ? 'Закрыть шлагбаум' : 'Открыть шлагбаум')
  return <button className={`device-card__switch${isOn ? ' device-card__switch--on' : ''}`} type="button" role="switch" aria-checked={isOn} aria-label={label} onClick={onToggle}><span /></button>
}

export default function Page1() {
  const { rooms, addRoom } = useOutletContext<LayoutContext>()
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceOptions, setDeviceOptions] = useState<DeviceTemplate[]>([])
  const [controlOverrides, setControlOverrides] = useState<Record<string, boolean>>({})
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [deviceRoom, setDeviceRoom] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetails | null>(null)
  const [detailsError, setDetailsError] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedRoom, setEditedRoom] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
          setControlOverrides((current) => {
            const remaining = { ...current }
            templates.forEach((template) => {
              const desired = current[template.key]
              if (desired === undefined) return
              const actual = template.key === 'light'
                ? Number(template.state.lamp) === 1
                : template.key === 'barrier' && Number(template.state.state) !== 0
              if (actual === desired) delete remaining[template.key]
            })
            return remaining
          })
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
    setEditedName(device.name)
    setEditedRoom(device.room ?? '')
    setIsEditingName(false)
    setIsDeviceMenuOpen(false)
    loadDeviceDetails(device)
  }

  const toggleDevice = async (template: DeviceTemplate) => {
    const isLight = template.key === 'light'
    const isOn = isLight ? Number(template.state.lamp) === 1 : Number(template.state.state) !== 0
    const signal = isLight ? 'lamp' : isOn ? 'close_cmd' : 'open_cmd'
    const commandValue = isLight ? (isOn ? 0 : 1) : 1
    const nextState = !isOn

    setControlOverrides((current) => ({ ...current, [template.key]: nextState }))

    try {
      await sendDeviceCommand(template.key, signal, commandValue)
    } catch (error) {
      setControlOverrides((current) => {
        const next = { ...current }
        delete next[template.key]
        return next
      })
      setTemplatesError(error instanceof Error ? error.message : 'Не удалось изменить состояние устройства')
    }
  }

  const displayTemplate = (template: DeviceTemplate): DeviceTemplate => {
    const override = controlOverrides[template.key]
    if (override === undefined) return template
    if (template.key === 'light') return { ...template, state: { ...template.state, lamp: override ? 1 : 0 } }
    if (template.key === 'barrier') return { ...template, state: { ...template.state, state: override ? 2 : 0 } }
    return template
  }

  const closeDeviceDetails = () => {
    setSelectedDevice(null)
    setDeviceDetails(null)
    setDetailsError('')
    setIsEditingName(false)
    setIsDeleteConfirmOpen(false)
  }

  const saveDeviceName = async () => {
    if (!selectedDevice || !editedName.trim()) return
    setIsSavingName(true)
    setDetailsError('')
    try {
      const updatedDevice = await updateStoredDevice(selectedDevice.id, { name: editedName.trim(), room: editedRoom || null })
      const updated = { ...selectedDevice, name: updatedDevice.name, room: updatedDevice.room }
      setDevices((current) => current.map((device) => device.id === updated.id ? updated : device))
      setSelectedDevice(updated)
      setIsEditingName(false)
      setIsDeviceMenuOpen(false)
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Не удалось сохранить название')
    } finally {
      setIsSavingName(false)
    }
  }

  const removeDevice = async () => {
    if (!selectedDevice) return
    setIsDeleting(true)
    setDetailsError('')
    try {
      await deleteStoredDevice(selectedDevice.id)
      setDevices((current) => current.filter((device) => device.id !== selectedDevice.id))
      closeDeviceDetails()
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Не удалось удалить устройство')
      setIsDeleteConfirmOpen(false)
    } finally {
      setIsDeleting(false)
    }
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
      <div className="room-tabs__scroll">
        <nav className="room-tabs" aria-label="Комнаты устройств">
          <button className={activeRoom === 'all' ? 'room-tabs__item room-tabs__item--active' : 'room-tabs__item'} type="button" onClick={() => setActiveRoom('all')}>Все устройства</button>
          {rooms.map((room) => (
            <button className={activeRoom === room.id ? 'room-tabs__item room-tabs__item--active' : 'room-tabs__item'} key={room.id} type="button" onClick={() => setActiveRoom(room.id)}>{room.name}</button>
          ))}
          <button className="room-tabs__add" type="button" aria-label="Добавить комнату" onClick={() => setIsRoomOpen(true)}>+</button>
        </nav>
      </div>

      {visibleDevices.length === 0 ? <p className="panel__text devices-panel__empty">Нет добавленных устройств</p> : (
        <div className="device-grid">
          {visibleDevices.map((device) => {
            const deviceTemplate = deviceOptions.find(({ key }) => key === device.templateKey)
            if (!deviceTemplate) return null
            const template = displayTemplate(deviceTemplate)
            return (
              <article className="device-card" key={device.id}>
                <div className="device-card__content">
                  <h2 className="device-card__name">{device.name}</h2>
                  {(template.key === 'light' || template.key === 'barrier') && <DeviceSwitch type={template.key} state={template.state} onToggle={() => toggleDevice(template)} />}
                  <DeviceState type={template.key} state={template.state} />
                </div>
                {deviceImages[template.key] ? (
                  <img className="device-card__image" src={deviceImages[template.key]} alt="" />
                ) : (
                  <div className="device-card__icon"><DeviceIcon type={template.key} /></div>
                )}
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
              <button type="button" className="device-modal__back" aria-label="Закрыть окно устройства" onClick={closeDeviceDetails}>←</button>
              {isEditingName ? (
                <div className="device-modal__name-editor">
                  <input id="device-details-title" className="device-modal__name-input" value={editedName} onChange={(event) => setEditedName(event.target.value)} maxLength={64} aria-label="Название устройства" autoFocus />
                </div>
              ) : (
                <h1 id="device-details-title">{selectedDevice.name}</h1>
              )}
              <div className="device-modal__menu">
                <button type="button" className="device-modal__more" aria-label="Действия с устройством" aria-expanded={isDeviceMenuOpen} onClick={() => setIsDeviceMenuOpen((open) => !open)}>
                  <span /><span /><span />
                </button>
                {isDeviceMenuOpen && !isEditingName && (
                  <div className="device-modal__menu-list">
                    <button type="button" onClick={() => { setIsEditingName(true); setIsDeviceMenuOpen(false) }}>Изменить</button>
                    <button type="button" className="device-modal__menu-delete" onClick={() => { setIsDeleteConfirmOpen(true); setIsDeviceMenuOpen(false) }}>Удалить</button>
                  </div>
                )}
              </div>
            </div>
            {deviceDetails && <p className="device-modal__subtitle">{deviceDetails.title}</p>}
            {detailsError && <p className="device-modal__error">{detailsError}</p>}
            {!deviceDetails && !detailsError && <p className="device-modal__loading">Загружаем данные…</p>}
            {deviceDetails && (
              <dl className="device-details">
                <div className="device-details__row">
                  <dt>Комната</dt>
                  {isEditingName ? (
                    <dd><select className="device-details__room-select" value={editedRoom} onChange={(event) => setEditedRoom(event.target.value)} aria-label="Комната устройства">
                      <option value="">Не выбрана</option>
                      {rooms.map((room) => <option key={room.id} value={room.name}>{room.name}</option>)}
                    </select></dd>
                  ) : (
                    <dd>{selectedDevice.room ?? 'Не выбрана'}</dd>
                  )}
                </div>
                {deviceDetails.declaration.filter((signal) => signal.name !== 'fw' && !hiddenDetailSignals[selectedDevice.templateKey]?.has(signal.name)).map((signal) => (
                  <div className="device-details__row" key={signal.name}>
                    <dt>{signal.title}</dt>
                    <dd>{formatSignalValue(signal)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {isEditingName && <button type="button" className="device-modal__save" onClick={saveDeviceName} disabled={isSavingName || !editedName.trim()}>Сохранить</button>}
          </section>
        </div>
      )}

      {isDeleteConfirmOpen && selectedDevice && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsDeleteConfirmOpen(false)}>
          <section className="device-modal device-modal--compact" role="dialog" aria-modal="true" aria-labelledby="delete-device-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="delete-device-title">Удалить устройство?</h1>
            </div>
            <p className="device-modal__confirm-text">«{selectedDevice.name}» будет удалено без возможности восстановления.</p>
            <div className="device-modal__confirm-actions">
              <button className="device-modal__cancel" type="button" onClick={() => setIsDeleteConfirmOpen(false)}>Отмена</button>
              <button className="device-modal__confirm-delete" type="button" onClick={removeDevice} disabled={isDeleting}>{isDeleting ? 'Удаляем…' : 'Удалить'}</button>
            </div>
          </section>
        </div>
      )}

      {showToast && <div className="device-toast" role="status">Устройство добавлено</div>}
    </section>
  )
}
