import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import type { LayoutContext } from '../components/Layout/Layout'

export default function Page4() {
  const { rooms } = useOutletContext<LayoutContext>()
  const [selectedRoom, setSelectedRoom] = useState<(typeof rooms)[number] | null>(null)

  return (
    <section className="panel rooms-panel" aria-label="Комнаты">
      {rooms.length === 0 ? (
        <p className="panel__text rooms-panel__empty">Нет добавленных комнат</p>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <article className="room-card" key={room.id}>
              {room.name}
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
