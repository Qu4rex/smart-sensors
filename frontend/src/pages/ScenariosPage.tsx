
import { useEffect, useState } from 'react'

import { apiGet } from '../api/client'

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
