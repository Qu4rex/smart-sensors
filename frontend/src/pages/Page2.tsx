import { useEffect, useRef, useState } from 'react'

import {
  listRules,
  simulateRule,
  type Rule,
  type SimulationResult,
} from '../api/rules'
import { useDeviceDetails } from '../hooks/useDeviceDetails'
import {
  capitalize,
  deviceNames,
  getDeviceImage,
  getDeviceName,
  operatorNames,
  parseValue,
} from '../utils/deviceLabels'

type Mode = 'rule' | 'custom'

function Row({ device, text, note }: { device: string; text: string; note?: string }) {
  const label = capitalize(getDeviceName(device))
  const image = getDeviceImage(device)

  return (
    <div className="scenario-row">
      <span className="scenario-avatar">
        {image ? (
          <img src={image} alt={label} className="scenario-device-image" />
        ) : (
          label.charAt(0)
        )}
      </span>

      <div className="scenario-row__text">
        <span className="scenario-row__label">{label}</span>
        <span className="scenario-row__value">{text}</span>
        {note && <span className="sim-row__note">{note}</span>}
      </div>
    </div>
  )
}

export default function Page2() {
  const [mode, setMode] = useState<Mode>('rule')
  const [rules, setRules] = useState<Rule[]>([])
  const [rulesLoading, setRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState('')

  const [ruleId, setRuleId] = useState('')
  const [device, setDevice] = useState('')
  const [signal, setSignal] = useState('')
  const [operator, setOperator] = useState('==')
  const [expected, setExpected] = useState('1')

  const [testValue, setTestValue] = useState('')

  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SimulationResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const { signals, status, load, signalTitle } = useDeviceDetails()

  useEffect(() => {
    let cancelled = false

    async function loadRules() {
      try {
        const data = await listRules()

        if (!cancelled) setRules(data)
      } catch (err) {
        if (!cancelled) {
          setRulesError(err instanceof Error ? err.message : 'Не удалось загрузить сценарии')
        }
      } finally {
        if (!cancelled) setRulesLoading(false)
      }
    }

    void loadRules()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedRule = rules.find((rule) => String(rule.id) === ruleId)

  /* любое изменение данных сбрасывает старый результат */
  function clearResult() {
    setResult(null)
    setError('')
  }

  function changeMode(next: Mode) {
    setMode(next)
    setTestValue('')
    clearResult()
  }

  function changeRule(value: string) {
    setRuleId(value)
    clearResult()

    const rule = rules.find((item) => String(item.id) === value)

    if (rule) {
      void load(rule.when.device)
      rule.then.forEach((action) => void load(action.device))
    }
  }

  function changeDevice(value: string) {
    setDevice(value)
    setSignal('')
    clearResult()
    void load(value)
  }

  async function check(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setChecking(true)
    clearResult()

    const value = testValue.trim() === '' ? undefined : parseValue(testValue)

    try {
      const data =
        mode === 'rule'
          ? await simulateRule({ rule_id: Number(ruleId), value })
          : await simulateRule({
              when: { device, signal, op: operator, value: parseValue(expected) },
              value,
            })

      /* названия сигналов в результате */
      void load(data.when.device)
      data.then.forEach((action) => void load(action.device))

      setResult(data)
      window.setTimeout(
        () => resultRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }),
        50,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить проверку')
    } finally {
      setChecking(false)
    }
  }

  const readableSignals = (signals[device] ?? []).filter((item) =>
    (item.management ?? '').includes('r'),
  )
  const signalState = device ? status[device] : undefined

  let signalPlaceholder = 'Выберите сигнал'
  if (!device) signalPlaceholder = 'Сначала выберите устройство'
  else if (signalState === 'loading') signalPlaceholder = 'Загружаем сигналы...'
  else if (signalState === 'error') signalPlaceholder = 'Не удалось загрузить'

  const canCheck =
    mode === 'rule' ? ruleId !== '' : device !== '' && signal !== '' && expected.trim() !== ''

  return (
    <section className="panel scenarios">
      <header className="scenarios__header">
        <div>
          <h1 className="panel__title">Эмуляция сценариев</h1>
          <p className="panel__text">Проверьте, сработает ли датчик, не трогая реальные устройства</p>
        </div>
      </header>

      <div className="sim-tabs" role="tablist" aria-label="Режим проверки">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'rule'}
          className={`sim-tab${mode === 'rule' ? ' is-active' : ''}`}
          onClick={() => changeMode('rule')}
        >
          Существующий сценарий
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'custom'}
          className={`sim-tab${mode === 'custom' ? ' is-active' : ''}`}
          onClick={() => changeMode('custom')}
        >
          Свои данные
        </button>
      </div>

      <form className="scenario-form" onSubmit={check}>
        {mode === 'rule' ? (
          <>
            <section>
              <h3 className="scenario-section__title">Сценарий</h3>

              {rulesLoading ? (
                <div className="scenarios__status">
                  <div className="notice notice--info" role="status">
                    <span className="spinner" aria-hidden="true" />
                    Загрузка сценариев
                  </div>
                </div>
              ) : rulesError ? (
                <p className="notice notice--error" role="alert">
                  {rulesError}
                </p>
              ) : rules.length === 0 ? (
                <p className="scenarios__empty">
                  Сценариев пока нет. Создайте его на странице сценариев или проверьте свои данные.
                </p>
              ) : (
                <div className="scenario-block scenario-block--padded">
                  <select
                    value={ruleId}
                    onChange={(event) => changeRule(event.target.value)}
                    aria-label="Сценарий"
                  >
                    <option value="">Выберите сценарий</option>
                    {rules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            {selectedRule && (
              <>
                <section>
                  <h3 className="scenario-section__title">Если</h3>
                  <div className="scenario-block">
                    <Row
                      device={selectedRule.when.device}
                      text={`${signalTitle(selectedRule.when.device, selectedRule.when.signal)} ${
                        operatorNames[selectedRule.when.op] ?? selectedRule.when.op
                      } ${selectedRule.when.value}`}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="scenario-section__title">Тогда</h3>
                  <div className="scenario-block">
                    {selectedRule.then.map((action, index) => (
                      <Row
                        key={`${action.device}-${action.signal}-${index}`}
                        device={action.device}
                        text={`${signalTitle(action.device, action.signal)}: ${action.value}`}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        ) : (
          <section>
            <h3 className="scenario-section__title">Если</h3>
            <div className="scenario-block">
              <div className="scenario-row">
                <span className="scenario-avatar">
                  {device && getDeviceImage(device) ? (
                    <img
                      src={getDeviceImage(device)}
                      alt={getDeviceName(device)}
                      className="scenario-device-image"
                    />
                  ) : device ? (
                    capitalize(getDeviceName(device)).charAt(0)
                  ) : (
                    '?'
                  )}
                </span>

                <div className="scenario-fields">
                  <label className="scenario-field">
                    <span className="scenario-field__caption">Устройство</span>
                    <select
                      value={device}
                      onChange={(event) => changeDevice(event.target.value)}
                      required
                    >
                      <option value="">Выберите устройство</option>
                      {Object.keys(deviceNames).map((key) => (
                        <option key={key} value={key}>
                          {capitalize(deviceNames[key])}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="scenario-field">
                    <span className="scenario-field__caption">Сигнал</span>
                    <select
                      value={signal}
                      onChange={(event) => {
                        setSignal(event.target.value)
                        clearResult()
                      }}
                      disabled={!device || signalState === 'loading' || signalState === 'error'}
                      required
                    >
                      <option value="">{signalPlaceholder}</option>
                      {readableSignals.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                    {signalState === 'error' && (
                      <button
                        type="button"
                        className="scenarios__link-button scenarios__link-button--small"
                        onClick={() => void load(device, true)}
                      >
                        Повторить загрузку
                      </button>
                    )}
                  </label>

                  <label className="scenario-field">
                    <span className="scenario-field__caption">Оператор</span>
                    <select
                      value={operator}
                      onChange={(event) => {
                        setOperator(event.target.value)
                        clearResult()
                      }}
                    >
                      {Object.entries(operatorNames).map(([op, title]) => (
                        <option key={op} value={op}>
                          {capitalize(title)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="scenario-field">
                    <span className="scenario-field__caption">Значение</span>
                    <input
                      value={expected}
                      onChange={(event) => {
                        setExpected(event.target.value)
                        clearResult()
                      }}
                      required
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h3 className="scenario-section__title">Показание датчика</h3>
          <div className="scenario-block scenario-block--padded">
            <input
              value={testValue}
              onChange={(event) => {
                setTestValue(event.target.value)
                clearResult()
              }}
              placeholder="Введите значение устройства"
              aria-label="Показание датчика"
            />
          </div>
        </section>

        {error && (
          <p className="notice notice--error scenario-form__error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="scenarios__button scenarios__button--accent scenario-form__submit"
          disabled={checking || !canCheck}
        >
          {checking ? 'Проверяем...' : 'Проверить'}
        </button>
      </form>

      {result && (
        <div className="sim-result" ref={resultRef}>
          <div
            className={`notice ${result.triggered ? 'notice--success' : 'notice--info'}`}
            role="status"
          >
            {result.triggered
              ? result.rule_id !== null
                ? 'Сценарий сработает'
                : 'Условие выполняется, датчик сработает'
              : result.rule_id !== null
                ? 'Сценарий не сработает'
                : 'Условие не выполняется, датчик не сработает'}
          </div>

          <h3 className="scenario-section__title">Проверка условия</h3>
          <div className="scenario-block">
            <Row
              device={result.when.device}
              text={`${signalTitle(result.when.device, result.when.signal)} ${
                operatorNames[result.when.op] ?? result.when.op
              } ${result.when.value}`}
              note={
                result.from_input
                  ? `Проверено введённое значение: ${result.checked} (на устройстве сейчас: ${result.current})`
                  : `Проверено текущее значение устройства: ${result.checked}`
              }
            />
          </div>

          {result.then.length > 0 && (
            <>
              <h3 className="scenario-section__title">
                {result.triggered ? 'Будет выполнено' : 'Не будет выполнено'}
              </h3>
              <div className={`scenario-block${result.triggered ? '' : ' sim-block--muted'}`}>
                {result.then.map((action, index) => (
                  <Row
                    key={`${action.device}-${action.signal}-${index}`}
                    device={action.device}
                    text={
                      action.device === 'notification'
                        ? `Уведомление: ${action.value}`
                        : `${signalTitle(action.device, action.signal)}: ${action.value}`
                    }
                  />
                ))}
              </div>
            </>
          )}

          {result.triggered && result.already_active && (
            <p className="sim-hint">
              Этот сценарий уже сработал на реальных устройствах и сейчас активен. Повторно он
              сработает только после того, как условие перестанет выполняться.
            </p>
          )}

          <p className="sim-hint">Это пробная проверка: команды не отправляются, устройства не меняются.</p>
        </div>
      )}
    </section>
  )
}
