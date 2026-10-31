import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import bathtubImage from '../assets/bathtub.png'
import bedroomImage from '../assets/bedroom.png'
import corridorImage from '../assets/corridor.png'
import kitchenImage from '../assets/kitchen.png'
import livingRoomImage from '../assets/living-room.png'
import outdoorImage from '../assets/outdoor.png'
import roomImage from '../assets/room.png'
import { listStoredDevices } from '../api/devices'
import type { LayoutContext } from '../components/Layout/Layout'

function getRoomImage(name: string) {
  const normalizedName = name.toLocaleLowerCase('ru-RU')
  if (normalizedName.includes('кухня')) return kitchenImage
  if (normalizedName.includes('гостиная')) return livingRoomImage
  if (normalizedName.includes('коридор')) return corridorImage
  if (normalizedName.includes('спальня')) return bedroomImage
  if (normalizedName.includes('улица')) return outdoorImage
  if (normalizedName.includes('ванн')) return bathtubImage
  return roomImage
}

function deviceCountLabel(count: number) {
  const lastTwoDigits = count % 100
  const lastDigit = count % 10
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} датчиков`
  if (lastDigit === 1) return `${count} датчик`
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} датчика`
  return `${count} датчиков`
}

export default function Page4() {
  const { rooms } = useOutletContext<LayoutContext>()
  const [selectedRoom, setSelectedRoom] = useState<(typeof rooms)[number] | null>(null)
  const [deviceCounts, setDeviceCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    listStoredDevices()
      .then((devices) => {
        const counts = devices.reduce<Record<string, number>>((result, device) => {
          if (device.room) result[device.room] = (result[device.room] ?? 0) + 1
          return result
        }, {})
        setDeviceCounts(counts)
      })
      .catch(() => setDeviceCounts({}))
  }, [])

  return (
    <section className="panel rooms-panel" aria-label="Комнаты">
      {rooms.length === 0 ? (
        <p className="panel__text rooms-panel__empty">Нет добавленных комнат</p>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <article className="room-card" key={room.id}>
              <span className="room-card__name">{room.name}</span>
              <span className="room-card__count">{deviceCountLabel(deviceCounts[room.name] ?? 0)}</span>
              <img className="room-card__image" src={getRoomImage(room.name)} alt="" />
              <button className="room-card__details" type="button" aria-label={`Открыть ${room.name}`} onClick={() => setSelectedRoom(room)}>↘</button>
            </article>
          ))}
        </div>
      )}
      {selectedRoom && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedRoom(null)}>
          <section className="device-modal device-modal--details" role="dialog" aria-modal="true" aria-labelledby="room-details-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="room-details-title">{selectedRoom.name}</h1>
              <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={() => setSelectedRoom(null)}>×</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
