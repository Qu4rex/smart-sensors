export default function Page1() {
  return (
    <section className="panel panel--center panel--with-add" aria-label="Устройства">
      <p className="panel__text">Нет добавленных устройств</p>
      <button className="panel__add" type="button" aria-label="Добавить устройство">
        +
      </button>
    </section>
  )
}
