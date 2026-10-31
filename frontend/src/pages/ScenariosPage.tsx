
import { useEffect, useState } from 'react'

import { apiGet } from '../api/client'

import { apiPost } from '../api/client'

type RuleAction = {
  device: string
  signal: string
  value: number | string
}

type Rule = {
  id: number
  name: string
  when: {
    device: string
    signal: string
    op: string
    value: number | string
  }
  then: RuleAction[]
}

/* передаем возможные сигналы */
type DeviceSignal = {
  name: string
  title: string
  control: string
  kind: string
  group: string
}

type DeviceDetails = {
  declaration: DeviceSignal[]
}


const deviceNames: Record<string, string> = {
  leak: 'датчик протечки',
  barrier: 'шлагбаум',
  thermostat: 'термостат',
  counter: 'счётчик электричества',
  light: 'освещение',
  fire: 'пожарный датчик',
  ventilation: 'вентиляция',
  elevator: 'лифт',
}

const operatorNames: Record<string, string> = {
  '==': 'равно',
  '!=': 'не равно',
  '>': 'больше',
  '<': 'меньше',
  '>=': 'больше или равно',
  '<=': 'меньше или равно',
}

function getDeviceName(device: string) {
  return deviceNames[device] ?? device
}

function getSignalName(
  device: string,
  signal: string,
  signalTitles: Record<string, string>,
) {
  const title = signalTitles[`${device}:${signal}`] ?? signal

  return title.charAt(0).toLowerCase() + title.slice(1)
}

function formatConditionValue(value: number | string) {
  return String(value)
}

export default function ScenariosPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const [name, setName] = useState('')
  const [triggerDevice, setTriggerDevice] = useState('')
  const [triggerSignal, setTriggerSignal] = useState('')
  const [operator, setOperator] = useState('==')
  const [triggerValue, setTriggerValue] = useState('1')

  const [actionDevice, setActionDevice] = useState('')
  const [actionSignal, setActionSignal] = useState('')
  const [actionValue, setActionValue] = useState('1')

  /* сигналы тут */
  const [triggerSignals, setTriggerSignals] = useState<DeviceSignal[]>([])
  const [actionSignals, setActionSignals] = useState<DeviceSignal[]>([])

  const [triggerSignalsLoading, setTriggerSignalsLoading] = useState(false)
  const [actionSignalsLoading, setActionSignalsLoading] = useState(false)

  const [triggerSignalsError, setTriggerSignalsError] = useState('')
  const [actionSignalsError, setActionSignalsError] = useState('')

  const [signalTitles, setSignalTitles] = useState<Record<string, string>>({})

  useEffect(() => {
  let cancelled = false

  async function loadSignalTitles() {
    const devices = Object.keys(deviceNames)

    const results = await Promise.all(
      devices.map(async (device) => {
        try {
          const data = await apiGet<DeviceDetails>(
            `/devices/${encodeURIComponent(device)}`,
          )

          return (data.declaration ?? []).map((signal) => ({
            key: `${device}:${signal.name}`,
            title: signal.title,
          }))
        } catch {
          return []
        }
      }),
    )

    if (!cancelled) {
      setSignalTitles(
        Object.fromEntries(
          results.flat().map(({ key, title }) => [key, title]),
        ),
      )
    }
  }

  void loadSignalTitles()

  return () => {
    cancelled = true
  }
}, [])

  useEffect(() => {
    let cancelled = false

    async function loadRules() {
      try {
        const data = await apiGet<Rule[]>('/rules')

        if (!cancelled) {
          setRules(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Не удалось загрузить сценарии',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRules()

    return () => {
      cancelled = true
    }
  }, [])

  /* Загружаем сигналы устройства для условия */
  useEffect(() => {
    setTriggerSignals([])
    setTriggerSignal('')
    setTriggerSignalsError('')

    if (!triggerDevice) {
      setTriggerSignalsLoading(false)
      return
    }

    let cancelled = false

    async function loadSignals() {
      setTriggerSignalsLoading(true)

      try {
        const data = await apiGet<DeviceDetails>(
          `/devices/${encodeURIComponent(triggerDevice)}`,
        )

        if (!cancelled) {
          setTriggerSignals(
            (data.declaration ?? []).filter(
              (signal) => signal.control.includes('r'),
            ),
          )
        }
      } catch (err) {
        if (!cancelled) {
          setTriggerSignalsError(
            err instanceof Error
              ? err.message
              : 'Не удалось загрузить сигналы',
          )
        }
      } finally {
        if (!cancelled) {
          setTriggerSignalsLoading(false)
        }
      }
    }

    void loadSignals()

    return () => {
      cancelled = true
    }
  }, [triggerDevice])

  /* два запроса тк устройство для условия может отличаться от устройства, которым мы управляем*/

  useEffect(() => {
    setActionSignals([])
    setActionSignal('')
    setActionSignalsError('')

    if (!actionDevice || actionDevice === 'notification') {
      setActionSignalsLoading(false)
      return
    }

    let cancelled = false

    async function loadSignals() {
      setActionSignalsLoading(true)

      try {
        const data = await apiGet<DeviceDetails>(
          `/devices/${encodeURIComponent(actionDevice)}`,
        )

        if (!cancelled) {
          setActionSignals(
            (data.declaration ?? []).filter(
              (signal) => signal.control.includes('w'),
            ),
          )
        }
      } catch (err) {
        if (!cancelled) {
          setActionSignalsError(
            err instanceof Error
              ? err.message
              : 'Не удалось загрузить сигналы',
          )
        }
      } finally {
        if (!cancelled) {
          setActionSignalsLoading(false)
        }
      }
    }

    void loadSignals()

    return () => {
      cancelled = true
    }
  }, [actionDevice])



  async function createRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (actionDevice === 'notification') {
      setFormError('Действие «Уведомление» пока не реализовано')
      return
    }

    setSaving(true)
    setFormError('')
    setFormSuccess('')

  const parseValue = (value: string) => {
    const trimmed = value.trim()

    if (trimmed === '') {
      throw new Error('Значение не может быть пустым')
    }

    const number = Number(trimmed)

    return Number.isFinite(number) ? number : trimmed
  }

  try {
    const created = await apiPost<Rule>('/rules', {
      name: name.trim(),
      when: {
        device: triggerDevice,
        signal: triggerSignal.trim(),
        op: operator,
        value: parseValue(triggerValue),
      },
      then: [
        {
          device: actionDevice,
          signal: actionSignal.trim(),
          value: parseValue(actionValue),
        },
      ],
    })

    setRules((previous) => [...previous, created])
    setName('')
    setTriggerSignal('')
    setActionSignal('')
    setFormSuccess('Сценарий успешно создан')
    setShowForm(false)
  } catch (err) {
    setFormError(
      err instanceof Error
        ? err.message
        : 'Не удалось создать сценарий',
    )
  } finally {
    setSaving(false)
  }
}

  return (
    <section className="panel scenarios">
      <header className="scenarios__header">
        <div>
          <h1 className="panel__title">Сценарии автоматизации</h1>
          <p className="panel__text">
            Правила взаимодействия между устройствами
          </p>
        </div>

        <span className="scenarios__count">
          {rules.length} сценариев
        </span>
      </header>

<div className="scenarios__toolbar">
  <button
    type="button"
    onClick={() => {
      setShowForm((previous) => !previous)
      setFormError('')
      setFormSuccess('')
    }}
  >
    {showForm ? 'Отмена' : '+ Создать сценарий'}
  </button>
</div>

{formSuccess && <p role="status">{formSuccess}</p>}

{showForm && (
  <form className="scenarios__form" onSubmit={createRule}>
    <h2>Новый сценарий</h2>

    <label>
      Название
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={100}
        placeholder="Например, Свет при протечке"
      />
    </label>

    <h3>Когда</h3>

    <label>
      Устройство
      <select
        value={triggerDevice}
        onChange={(event) => setTriggerDevice(event.target.value)}
      >
        <option value="">Выберите устройство</option>
        <option value="leak">Датчик протечки</option>
        <option value="barrier">Шлагбаум</option>
        <option value="thermostat">Термостат</option>
        <option value="counter">Счётчик электричества</option>
        <option value="light">Освещение</option>
        <option value="fire">Пожарный датчик</option>
        <option value="ventilation">Вентиляция</option>
        <option value="elevator">Лифт</option>
      </select>
    </label>

    <label>
      Сигнал
      <select
        value={triggerSignal}
        onChange={(event) => setTriggerSignal(event.target.value)}
        disabled={!triggerDevice || triggerSignalsLoading || !!triggerSignalsError}
        required
      >
        <option value="">
          {!triggerDevice
            ? 'Сначала выберите устройство'
            : triggerSignalsLoading
              ? 'Загружаем сигналы...'
              : 'Выберите сигнал'}
        </option>
          
        {triggerSignals.map((signal) => (
          <option key={signal.name} value={signal.name}>
            {signal.title}
          </option>
        ))}
      </select>

  {triggerSignalsError && (
    <span role="alert" className="scenarios__message--error">
      {triggerSignalsError}
    </span>
  )}
</label>
    <label>
      Оператор
      <select
        value={operator}
        onChange={(event) => setOperator(event.target.value)}
      >
        <option value="==">Равно</option>
        <option value="!=">Не равно</option>
        <option value=">">Больше</option>
        <option value="<">Меньше</option>
        <option value=">=">Больше или равно</option>
        <option value="<=">Меньше или равно</option>
      </select>
    </label>

    <label>
      Значение условия
      <input
        value={triggerValue}
        onChange={(event) => setTriggerValue(event.target.value)}
        required
      />
    </label>

    <h3>Тогда выполнить</h3>

    <label>
      Действие 
      <select
        value={actionDevice}
        onChange={(event) => setActionDevice(event.target.value)}
        required
      >
        <option value="">Выберите действие</option>
        <option value="light">Освещение</option>
        <option value="ventilation">Вентиляция</option>
        <option value="barrier">Шлагбаум</option>
        <option value="thermostat">Термостат</option>
        <option value="elevator">Лифт</option>
        <option value="notification">Уведомление</option>
      </select>
    </label>

    <label>
      Сигнал действия
      <select
        value={actionSignal}
        onChange={(event) => setActionSignal(event.target.value)}
        disabled={
          !actionDevice ||
          actionDevice === 'notification' ||
          actionSignalsLoading ||
          !!actionSignalsError
        }
        required
      >

        <option value="">
          {!actionDevice
            ? 'Сначала выберите устройство'
            : actionSignalsLoading
              ? 'Загружаем сигналы...'
              : 'Выберите сигнал'}
        </option>

        {actionSignals.map((signal) => (
          <option key={signal.name} value={signal.name}>
            {signal.title}
          </option>
        ))}
      </select>

      {actionSignalsError && (
        <span role="alert" className="scenarios__message--error">
          {actionSignalsError}
        </span>
      )}
    </label>

<label>
  Значение действия
  <input
    value={actionValue}
    onChange={(event) => setActionValue(event.target.value)}
    required
  />
</label>

    {formError && (
      <p className="scenarios__message--error" role="alert">
        {formError}
      </p>
    )}

    <button type="submit" disabled={saving}>
      {saving ? 'Сохраняем...' : 'Сохранить сценарий'}
    </button>
  </form>
)}


      {loading && <p>Загружаем сценарии...</p>}

      {!loading && error && (
        <div className="scenarios__message scenarios__message--error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Повторить
          </button>
        </div>
      )}

      {!loading && !error && rules.length === 0 && (
        <div className="scenarios__empty">
          <h2>Пока нет сценариев</h2>
          <p>
            Когда правила появятся на сервере, они отобразятся здесь.
          </p>
        </div>
      )}

      
    {!loading && !error && rules.length > 0 && (
      <div className="scenarios__list">
        {rules.map((rule) => (
          <article className="scenarios__card" key={rule.id}>
            <h2>{rule.name}</h2>
        
            <div className="scenario-rule">
              <p className="scenario-rule__label">ЕСЛИ</p>
        
              <p className="scenario-rule__condition">
                {getDeviceName(rule.when.device)} —{' '}
                {getSignalName(rule.when.device, rule.when.signal, signalTitles)}
                {operatorNames[rule.when.op] ?? rule.when.op}{' '}
                {formatConditionValue(rule.when.value)}
              </p>
        
              <p className="scenario-rule__label">ТО</p>
        
              <ul className="scenario-rule__actions">
                {rule.then.map((action, index) => (
                  <li key={`${action.device}-${action.signal}-${index}`}>
                    {getDeviceName(action.device)} —{' '}
                    {getSignalName(action.device, action.signal, signalTitles)}
                    {String(action.value)}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    )}

    </section>
  )
}
