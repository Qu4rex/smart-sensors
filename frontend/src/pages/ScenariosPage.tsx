
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

export default function ScenariosPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const [name, setName] = useState('')
  const [triggerDevice, setTriggerDevice] = useState('leak')
  const [triggerSignal, setTriggerSignal] = useState('')
  const [operator, setOperator] = useState('==')
  const [triggerValue, setTriggerValue] = useState('1')

  const [actionDevice, setActionDevice] = useState('light')
  const [actionSignal, setActionSignal] = useState('')
  const [actionValue, setActionValue] = useState('1')

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

async function createRule(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault()

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
        <option value="leak">Датчик протечки</option>
        <option value="barrier">Барьер</option>
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
      <input
        value={triggerSignal}
        onChange={(event) => setTriggerSignal(event.target.value)}
        required
        placeholder="Название сигнала"
      />
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
      Устройство
      <select
        value={actionDevice}
        onChange={(event) => setActionDevice(event.target.value)}
      >
        <option value="light">Освещение</option>
        <option value="ventilation">Вентиляция</option>
        <option value="barrier">Барьер</option>
        <option value="thermostat">Термостат</option>
        <option value="elevator">Лифт</option>
      </select>
    </label>

    <label>
      Сигнал действия
      <input
        value={actionSignal}
        onChange={(event) => setActionSignal(event.target.value)}
        required
        placeholder="Название сигнала"
      />
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

              <p>
                <strong>Условие:</strong>{' '}
                {rule.when.device} · {rule.when.signal}{' '}
                {rule.when.op} {String(rule.when.value)}
              </p>

              <div>
                <strong>Действия:</strong>

                <ul>
                  {rule.then.map((action, index) => (
                    <li key={`${action.device}-${action.signal}-${index}`}>
                      {action.device} · {action.signal} ={' '}
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
