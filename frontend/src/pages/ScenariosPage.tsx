import { useCallback, useEffect, useRef, useState } from 'react'

import { apiDelete, apiGet, apiPost, apiPut } from '../api/client'

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
  management: string
}

type DeviceDetails = {
  declaration: DeviceSignal[]
}

type LoadStatus = 'loading' | 'ok' | 'error'

/* строка действия в форме */
type ActionDraft = {
  key: number
  device: string
  signal: string
  value: string
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

const NOTICE_MS = 3500
const NOTICE_FADE_MS = 300

/* устройства, которыми можно управлять в блоке «Тогда» */
const actionDeviceIds = ['light', 'ventilation', 'barrier', 'thermostat', 'elevator']

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function getDeviceName(device: string) {
  if (device === 'notification') return 'уведомление'
  return deviceNames[device] ?? device
}

function pluralizeScenarios(count: number) {
  const lastTwo = count % 100
  const last = count % 10

  if (lastTwo >= 11 && lastTwo <= 14) return `${count} сценариев`
  if (last === 1) return `${count} сценарий`
  if (last >= 2 && last <= 4) return `${count} сценария`
  return `${count} сценариев`
}

function parseValue(value: string) {
  const trimmed = value.trim()

  if (trimmed === '') {
    throw new Error('Значение не может быть пустым')
  }

  const number = Number(trimmed)

  return Number.isFinite(number) ? number : trimmed
}

/* строка действия в карточке сценария */
function ScenarioRow({ device, text }: { device: string; text: string }) {
  const label = capitalize(getDeviceName(device))

  return (
    <div className="scenario-row">
      <span className="scenario-avatar" aria-hidden="true">
        {label.charAt(0)}
      </span>

      <div className="scenario-row__text">
        <span className="scenario-row__label">{label}</span>
        <span className="scenario-row__value">{text}</span>
      </div>
    </div>
  )
}

type SignalSelectProps = {
  device: string
  mode: 'r' | 'w'
  value: string
  declarations: Record<string, DeviceSignal[]>
  status: Record<string, LoadStatus>
  onChange: (signal: string) => void
  onRetry: (device: string) => void
}

function SignalSelect({
  device,
  mode,
  value,
  declarations,
  status,
  onChange,
  onRetry,
}: SignalSelectProps) {
  const state = device ? status[device] : undefined

  const signals = (declarations[device] ?? []).filter((signal) =>
    signal.control.includes(mode),
  )

  const disabled =
    !device ||
    device === 'notification' ||
    state === 'loading' ||
    state === 'error'

  let placeholder = 'Выберите сигнал'

  if (!device) placeholder = 'Сначала выберите устройство'
  else if (device === 'notification') placeholder = 'Не требуется'
  else if (state === 'loading') placeholder = 'Загружаем сигналы...'
  else if (state === 'error') placeholder = 'Не удалось загрузить'

  return (
    <>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={device !== 'notification'}
        aria-label="Сигнал"
      >
        <option value="">{placeholder}</option>

        {signals.map((signal) => (
          <option key={signal.name} value={signal.name}>
            {signal.title}
          </option>
        ))}
      </select>

      {state === 'error' && (
        <button
          type="button"
          className="scenarios__link-button scenarios__link-button--small"
          onClick={() => onRetry(device)}
        >
          Повторить загрузку
        </button>
      )}
    </>
  )
}

export default function ScenariosPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /* уведомления */
  const [notice, setNotice] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const [noticeOpen, setNoticeOpen] = useState(false)
  const noticeTimers = useRef<number[]>([])

  /* поля формы */
  const keyCounter = useRef(0)
  const sectionRef = useRef<HTMLElement>(null)

  function emptyAction(): ActionDraft {
    keyCounter.current += 1
    return { key: keyCounter.current, device: '', signal: '', value: '1' }
  }

  const [name, setName] = useState('')
  const [triggerDevice, setTriggerDevice] = useState('')
  const [triggerSignal, setTriggerSignal] = useState('')
  const [operator, setOperator] = useState('==')
  const [triggerValue, setTriggerValue] = useState('1')

  const [actions, setActions] = useState<ActionDraft[]>(() => [
    { key: 0, device: '', signal: '', value: '1' },
  ])

  /* описания сигналов устройств */
  const [declarations, setDeclarations] = useState<Record<string, DeviceSignal[]>>({})
  const [declStatus, setDeclStatus] = useState<Record<string, LoadStatus>>({})
  const requested = useRef<Set<string>>(new Set())

  const loadDeclaration = useCallback(async (device: string, force = false) => {
  if (!device || device === 'notification') return
  if (!force && requested.current.has(device)) return

  requested.current.add(device)
  setDeclStatus((previous) => ({ ...previous, [device]: 'loading' }))

  try {
    const data = await apiGet<DeviceDetails>(`/devices/${encodeURIComponent(device)}`)

    setDeclarations((previous) => ({
      ...previous,
      [device]: data.declaration ?? [],
    }))

    setDeclStatus((previous) => ({ ...previous, [device]: 'ok' }))
  } catch {
    requested.current.delete(device)
    setDeclStatus((previous) => ({ ...previous, [device]: 'error' }))
  }
}, [])

useEffect(() => {
  Object.keys(deviceNames).forEach((device) => {
    void loadDeclaration(device)
  })
}, [loadDeclaration])

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

  useEffect(() => {
  const timers = noticeTimers.current

        if (!cancelled) {
          const available = (data.declaration ?? []).filter((signal) =>
            signal.management.includes('r'),
          )
          setTriggerSignals(available)

          const pending = pendingTriggerSignal.current
          pendingTriggerSignal.current = null
          if (pending && available.some((signal) => signal.name === pending)) {
            setTriggerSignal(pending)
          }
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

function showNotice(text: string, kind: 'success' | 'error' = 'success') {
  const timers = noticeTimers.current

  timers.forEach((timer) => window.clearTimeout(timer))
  timers.length = 0

  setNotice({ text, kind })

        if (!cancelled) {
          const available = (data.declaration ?? []).filter((signal) =>
            signal.management.includes('w'),
          )
          setActionSignals(available)

function scrollToTop() {
  sectionRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
}

function signalTitle(device: string, signal: string) {
  return declarations[device]?.find((item) => item.name === signal)?.title ?? signal
}


  function resetForm() {
    setEditingId(null)
    setName('')
    setTriggerDevice('')
    setTriggerSignal('')
    setOperator('==')
    setTriggerValue('1')
    setActions([emptyAction()])
    setFormError('')
  }

  function openCreateForm() {
    resetForm()
    setShowForm(true)
  }

  function closeForm() {
    resetForm()
    setShowForm(false)
  }

  function startEdit(rule: Rule) {
    setFormError('')
    setEditingId(rule.id)
    setName(rule.name)
    setTriggerDevice(rule.when.device)
    setTriggerSignal(rule.when.signal)
    setOperator(rule.when.op)
    setTriggerValue(String(rule.when.value))
    setActions(
      rule.then.length > 0
        ? rule.then.map((action) => {
            keyCounter.current += 1
            return {
              key: keyCounter.current,
              device: action.device,
              signal: action.signal,
              value: String(action.value),
            }
          })
        : [emptyAction()],
    )

    void loadDeclaration(rule.when.device)
    rule.then.forEach((action) => void loadDeclaration(action.device))

    setShowForm(true)
    scrollToTop()
  }

  function changeTriggerDevice(device: string) {
    setTriggerDevice(device)
    setTriggerSignal('')
    void loadDeclaration(device)
  }

  function updateAction(key: number, patch: Partial<ActionDraft>) {
    setActions((previous) =>
      previous.map((action) => (action.key === key ? { ...action, ...patch } : action)),
    )
  }

  function changeActionDevice(key: number, device: string) {
    updateAction(key, { device, signal: '' })
    void loadDeclaration(device)
  }

  function addAction() {
    setActions((previous) => [...previous, emptyAction()])
  }

  function removeAction(key: number) {
    setActions((previous) =>
      previous.length > 1 ? previous.filter((action) => action.key !== key) : previous,
    )
  }

  async function deleteRule(rule: Rule) {
    if (!window.confirm(`Удалить сценарий «${rule.name}»?`)) return

    setDeletingId(rule.id)

    try {
      await apiDelete(`/rules/${rule.id}`)
      setRules((previous) => previous.filter((item) => item.id !== rule.id))

      if (editingId === rule.id) {
        closeForm()
      }
      showNotice('Сценарий успешно удалён')
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Не удалось удалить сценарий', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  async function saveRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (actions.some((action) => action.device === 'notification')) {
      setFormError('Действие «Уведомление» пока не реализовано')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const payload = {
        name: name.trim(),
        when: {
          device: triggerDevice,
          signal: triggerSignal.trim(),
          op: operator,
          value: parseValue(triggerValue),
        },
        then: actions.map((action) => ({
          device: action.device,
          signal: action.signal.trim(),
          value: parseValue(action.value),
        })),
      }

      if (editingId === null) {
        const created = await apiPost<Rule>('/rules', payload)
        setRules((previous) => [...previous, created])
        showNotice('Сценарий успешно создан')
      } else {
        const updated = await apiPut<Rule>(`/rules/${editingId}`, payload)
        setRules((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item)),
        )
        showNotice('Сценарий успешно обновлён')
      }

      closeForm()
      scrollToTop()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось сохранить сценарий')
    } finally {
      setSaving(false)
    }
  }


  return (
    <section className="panel scenarios" ref={sectionRef}>
      <header className="scenarios__header">
        <div>
          <h1 className="panel__title">Сценарии автоматизации</h1>
          <p className="panel__text">Правила взаимодействия между устройствами</p>
        </div>
        <span className="scenarios__count">{pluralizeScenarios(rules.length)}</span>
      </header>

      <div className={`scenarios__notice-slot${noticeOpen ? ' is-open' : ''}`}>
        <div className="scenarios__notice-clip">
          {notice && (
            <div className={`notice notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
              {notice.text}
            </div>
          )}
        </div>
      </div>

      <div className="scenarios__toolbar">
        {showForm ? (
          <button type="button" className="scenarios__button" onClick={closeForm}>
            Отмена
          </button>
        ) : (
          <button type="button" className="scenarios__button scenarios__button--accent" onClick={openCreateForm}>
            + Создать сценарий
          </button>
        )}
      </div>

      {showForm && (
        <form className="scenario-form" onSubmit={saveRule}>
          <h2 className="scenario-form__title">
            {editingId === null ? 'Новый сценарий' : 'Редактирование сценария'}
          </h2>

          <section>
            <h3 className="scenario-section__title">Название сценария</h3>
            <div className="scenario-block scenario-block--padded">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={100}
                placeholder="Например, Свет при протечке"
                aria-label="Название сценария"
              />
            </div>
          </section>

          <section>
            <h3 className="scenario-section__title">Если</h3>
            <div className="scenario-block">
              <div className="scenario-row">
                <span className="scenario-avatar" aria-hidden="true">
                  {triggerDevice ? capitalize(getDeviceName(triggerDevice)).charAt(0) : '?'}
                </span>
                <div className="scenario-fields">
                  <label className="scenario-field">
                    <span className="scenario-field__caption">Устройство</span>
                    <select value={triggerDevice} onChange={(event) => changeTriggerDevice(event.target.value)} required>
                      <option value="">Выберите устройство</option>
                      {Object.keys(deviceNames).map((device) => (
                        <option key={device} value={device}>{capitalize(deviceNames[device])}</option>
                      ))}
                    </select>
                  </label>

                  <label className="scenario-field">
                    <span className="scenario-field__caption">Сигнал</span>
                    <SignalSelect
                      device={triggerDevice}
                      mode="r"
                      value={triggerSignal}
                      declarations={declarations}
                      status={declStatus}
                      onChange={setTriggerSignal}
                      onRetry={(device) => void loadDeclaration(device, true)}
                    />
                  </label>

                  <label className="scenario-field">
                    <span className="scenario-field__caption">Оператор</span>
                    <select value={operator} onChange={(event) => setOperator(event.target.value)}>
                      {Object.entries(operatorNames).map(([op, title]) => (
                        <option key={op} value={op}>{capitalize(title)}</option>
                      ))}
                    </select>
                  </label>

                  <label className="scenario-field">
                    <span className="scenario-field__caption">Значение</span>
                    <input value={triggerValue} onChange={(event) => setTriggerValue(event.target.value)} required />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="scenario-section__title">Тогда</h3>
            <div className="scenario-block">
              {actions.map((action) => (
                <div className="scenario-row" key={action.key}>
                  <span className="scenario-avatar" aria-hidden="true">
                    {action.device ? capitalize(getDeviceName(action.device)).charAt(0) : '?'}
                  </span>
                  <div className="scenario-fields">
                    <label className="scenario-field">
                      <span className="scenario-field__caption">Устройство</span>
                      <select value={action.device} onChange={(event) => changeActionDevice(action.key, event.target.value)} required>
                        <option value="">Выберите устройство</option>
                        {actionDeviceIds.map((device) => (
                          <option key={device} value={device}>{capitalize(deviceNames[device])}</option>
                        ))}
                        <option value="notification">Уведомление</option>
                      </select>
                    </label>

                    <label className="scenario-field">
                      <span className="scenario-field__caption">Сигнал</span>
                      <SignalSelect
                        device={action.device}
                        mode="w"
                        value={action.signal}
                        declarations={declarations}
                        status={declStatus}
                        onChange={(signal) => updateAction(action.key, { signal })}
                        onRetry={(device) => void loadDeclaration(device, true)}
                      />
                    </label>

                    <label className="scenario-field">
                      <span className="scenario-field__caption">Значение</span>
                      <input value={action.value} onChange={(event) => updateAction(action.key, { value: event.target.value })} required />
                    </label>
                  </div>

                  {actions.length > 1 && (
                    <button type="button" className="scenario-row__remove" onClick={() => removeAction(action.key)} aria-label="Убрать действие" title="Убрать действие">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="scenarios__link-button" onClick={addAction}>
              <span aria-hidden="true">+</span> Добавить действие
            </button>
          </section>

          {formError && <p className="notice notice--error scenario-form__error" role="alert">{formError}</p>}

          <button type="submit" className="scenarios__button scenarios__button--accent scenario-form__submit" disabled={saving}>
            {saving ? 'Сохраняем...' : editingId === null ? 'Сохранить' : 'Сохранить изменения'}
          </button>
        </form>
      )}

      {loading && (
        <div className="scenarios__status">
          <div className="notice notice--info" role="status">
            <span className="spinner" aria-hidden="true" />
            Загрузка сценариев
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="scenarios__status">
          <div className="notice notice--error" role="alert">
            {error}
            <button type="button" className="scenarios__link-button scenarios__link-button--small" onClick={() => window.location.reload()}>
              Повторить
            </button>
          </div>
        </div>
      )}

      {!loading && !error && rules.length === 0 && (
        <div className="scenarios__empty">
          <h2>Пока нет сценариев</h2>
          <p>Создайте первый сценарий, и он появится здесь.</p>
        </div>
      )}

      {!loading && !error && rules.length > 0 && (
        <div className="scenarios__list">
          {rules.map((rule) => (
            <article className="scenario-card" key={rule.id}>
              <h2 className="scenario-card__title">{rule.name}</h2>

              <h3 className="scenario-section__title">Если</h3>
              <div className="scenario-block">
                <ScenarioRow
                  device={rule.when.device}
                  text={`${signalTitle(rule.when.device, rule.when.signal)} ${operatorNames[rule.when.op] ?? rule.when.op} ${rule.when.value}`}
                />
              </div>

              <h3 className="scenario-section__title">Тогда</h3>
              <div className="scenario-block">
                {rule.then.map((action, index) => (
                  <ScenarioRow
                    key={`${action.device}-${action.signal}-${index}`}
                    device={action.device}
                    text={`${signalTitle(action.device, action.signal)}: ${action.value}`}
                  />
                ))}
              </div>

              <div className="scenario-card__actions">
                <button type="button" className="scenarios__button" onClick={() => startEdit(rule)} disabled={deletingId === rule.id}>
                  Редактировать
                </button>
                <button type="button" className="scenarios__button scenarios__button--danger" onClick={() => void deleteRule(rule)} disabled={deletingId === rule.id}>
                  {deletingId === rule.id ? 'Удаляем...' : 'Удалить'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
