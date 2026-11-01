import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import bathroomImage from '../assets/bathroom.png'
import bedroomImage from '../assets/bedroom.png'
import corridorImage from '../assets/corridor.png'
import kitchenImage from '../assets/kitchen.png'
import livingRoomImage from '../assets/living-room.png'
import streetImage from '../assets/street.png'
import { deleteStoredDevice, listStoredDevices, type StoredDevice } from '../api/devices'
import type { LayoutContext, Room } from '../components/Layout/Layout'

function getRoomImage(name: string) {
  const value = name.toLocaleLowerCase('ru-RU')
  if (value.includes('кухня')) return kitchenImage
  if (value.includes('гостин')) return livingRoomImage
  if (value.includes('коридор')) return corridorImage
  if (value.includes('спальня')) return bedroomImage
  if (value.includes('улица')) return streetImage
  if (value.includes('ванн')) return bathroomImage
  return livingRoomImage
}

function countLabel(count: number) {
  if (count % 100 >= 11 && count % 100 <= 14) return `${count} датчиков`
  if (count % 10 === 1) return `${count} датчик`
  if (count % 10 >= 2 && count % 10 <= 4) return `${count} датчика`
  return `${count} датчиков`
}

const deviceTypeLabels: Record<string, string> = {
  barrier: 'Шлагбаум',
  thermostat: 'Термостат',
  counter: 'Счётчик',
  light: 'Светильник',
  leak: 'Датчик протечки',
  fire: 'Датчик пожара',
  ventilation: 'Вентиляция',
  elevator: 'Лифт',
}

export default function Page4() {
  const { rooms, updateRoom, deleteRoom } = useOutletContext<LayoutContext>()
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [devices, setDevices] = useState<StoredDevice[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadDevices = () => listStoredDevices().then(setDevices).catch(() => setDevices([]))
  useEffect(() => { void loadDevices() }, [])
  const roomDevices = selectedRoom ? devices.filter((device) => device.room === selectedRoom.name) : []

  const openRoom = (room: Room) => {
    setSelectedRoom(room); setRoomName(room.name); setIsEditing(false); setIsMenuOpen(false); void loadDevices()
  }
  const saveRoom = async () => {
    if (!selectedRoom || !roomName.trim()) return
    setIsSaving(true)
    try {
      const room = await updateRoom(selectedRoom.id, roomName.trim())
      setDevices((current) => current.map((device) => device.room === selectedRoom.name ? { ...device, room: room.name } : device))
      setSelectedRoom(room); setIsEditing(false)
    } finally { setIsSaving(false) }
  }
  const removeDevice = async (device: StoredDevice) => {
    if (!window.confirm(`Удалить датчик «${device.name}»?`)) return
    await deleteStoredDevice(device.id)
    setDevices((current) => current.filter((item) => item.id !== device.id))
  }
  const removeRoom = async () => {
    if (!selectedRoom || !window.confirm(`Удалить комнату «${selectedRoom.name}» и все её датчики?`)) return
    await deleteRoom(selectedRoom.id)
    setDevices((current) => current.filter((device) => device.room !== selectedRoom.name))
    setSelectedRoom(null)
  }

  return <section className="panel rooms-panel" aria-label="Комнаты">
    <h1 className="rooms-panel__title">Ваши комнаты</h1>
    {rooms.length === 0 ? <p className="panel__text rooms-panel__empty">Нет добавленных комнат</p> : <div className="rooms-grid">
      {rooms.map((room) => <article className="room-card" key={room.id}>
        <span className="room-card__name">{room.name}</span>
        <span className="room-card__count">{countLabel(devices.filter((device) => device.room === room.name).length)}</span>
        <img className="room-card__image" src={getRoomImage(room.name)} alt="" />
        <button className="room-card__details" type="button" aria-label={`Открыть ${room.name}`} onClick={() => openRoom(room)}>↘</button>
      </article>)}
    </div>}
    {selectedRoom && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedRoom(null)}>
      <section className="device-modal device-modal--details" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="device-modal__header">
          {isEditing ? <input className="device-modal__name-input" value={roomName} onChange={(event) => setRoomName(event.target.value)} aria-label="Название комнаты" autoFocus /> : <h1>{selectedRoom.name}</h1>}
          <div className="device-modal__menu room-modal__menu">
            <button type="button" className="device-modal__more" aria-label="Действия с комнатой" onClick={() => setIsMenuOpen((value) => !value)}><span /><span /><span /></button>
            {isMenuOpen && <div className="device-modal__menu-list room-modal__menu-list"><button type="button" onClick={() => { setIsEditing(true); setIsMenuOpen(false) }}>Изменить</button><button type="button" className="device-modal__menu-delete" onClick={() => void removeRoom()}>Удалить</button></div>}
          </div>
          <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={() => setSelectedRoom(null)}>×</button>
        </div>
        <div className="room-modal__devices">
          {roomDevices.length === 0 ? <p className="panel__text">В этой комнате пока нет датчиков</p> : <ul className="room-modal__device-list">
            {roomDevices.map((device) => <li key={device.id}><span>{device.name}</span><small>{deviceTypeLabels[device.device_type] ?? device.device_type}</small>{isEditing && <button type="button" className="room-modal__device-delete" aria-label={`Удалить ${device.name}`} onClick={() => void removeDevice(device)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M10 11v6m4-6v6M9 7l1-3h4l1 3m-9 0 1 13h10l1-13" /></svg></button>}</li>)}
          </ul>}
        </div>
        {isEditing && <button className="device-modal__save" type="button" onClick={() => void saveRoom()} disabled={isSaving || !roomName.trim()}>Сохранить</button>}
      </section>
    </div>}
  </section>
}
