import { apiGet, apiPost } from './client'

export type RuleAction = {
  device: string
  signal: string
  value: number | string
}

export type RuleCondition = {
  device: string
  signal: string
  op: string
  value: number | string
}

export type Rule = {
  id: number
  name: string
  when: RuleCondition
  then: RuleAction[]
}

export type SimulationResult = {
  rule_id: number | null
  rule_name: string | null
  when: RuleCondition
  current: number | string
  checked: number | string
  from_input: boolean
  triggered: boolean
  already_active: boolean
  then: RuleAction[]
}

export type SimulationRequest = {
  rule_id?: number
  when?: RuleCondition
  value?: number | string
}

export function listRules(): Promise<Rule[]> {
  return apiGet<Rule[]>('/rules')
}

export function simulateRule(request: SimulationRequest): Promise<SimulationResult> {
  return apiPost<SimulationResult>('/rules/simulate', request)
}
