// Правила номера телефона те же, что на backend (backend/src/schemas/user.py).
const PHONE_RE = /^7\d{10}$/

// Пароль: от 8 до 18 символов, латиница, цифры и символы, без пробелов и кириллицы
const PASSWORD_RE = /^[!-~]{8,18}$/

export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('8') ? `7${digits.slice(1, 11)}` : digits.slice(0, 11)
}

export function formatPhone(value: string): string {
  const digits = phoneDigits(value)
  const local = digits.startsWith('7') ? digits.slice(1) : digits
  const parts = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 8), local.slice(8, 10)]
  let result = '+7'
  if (parts[0]) result += ` (${parts[0]}`
  if (parts[0].length === 3) result += ')'
  if (parts[1]) result += ` ${parts[1]}`
  if (parts[2]) result += `-${parts[2]}`
  if (parts[3]) result += `-${parts[3]}`
  return result
}

export function validatePhone(value: string): string {
  if (!value || phoneDigits(value).length < 2) return 'Введите номер телефона'
  if (!/^[+()\s\d-]+$/.test(value)) return 'Введите номер в формате +7 (999) 999-99-99'
  if (!PHONE_RE.test(phoneDigits(value))) return 'Введите номер в формате +7 (999) 999-99-99'
  return ''
}

export function validatePassword(value: string): string {
  if (!value) return 'Введите пароль'
  if (value.length < 8 || value.length > 18) return 'Пароль должен быть от 8 до 18 символов'
  if (!PASSWORD_RE.test(value)) return 'Только латинские буквы, цифры и символы, без пробелов'
  return ''
}

export function validateConfirm(password: string, confirm: string): string {
  if (!confirm) return 'Повторите пароль'
  if (password !== confirm) return 'Пароли не совпадают'
  return ''
}
