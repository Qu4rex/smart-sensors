import { useOutletContext } from 'react-router-dom'

import type { LayoutContext } from '../components/Layout/Layout'

export default function Page4() {
  const { rooms } = useOutletContext<LayoutContext>()

  return (
    <section className="panel rooms-panel" aria-label="Комнаты">
      {rooms.length === 0 ? (
        <p className="panel__text rooms-panel__empty">Нет добавленных комнат</p>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => <article className="room-card" key={room.id}>{room.name}</article>)}
        </div>
      )}
    </section>
  )
}
