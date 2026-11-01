import barrierImage from '../assets/barrier.png'
import counterImage from '../assets/counter.png'
import elevatorImage from '../assets/elevator.png'
import fireImage from '../assets/fire.png'
import leakImage from '../assets/leak.png'
import lightImage from '../assets/light.png'
import thermostatImage from '../assets/thermostat.png'
import ventilationImage from '../assets/ventilation.png'

export const deviceNames: Record<string, string> = {
  leak: 'датчик протечки',
  barrier: 'шлагбаум',
  thermostat: 'термостат',
  counter: 'счётчик электричества',
  light: 'освещение',
  fire: 'пожарный датчик',
  ventilation: 'вентиляция',
  elevator: 'лифт',
}

export const operatorNames: Record<string, string> = {
  '==': 'равно',
  '!=': 'не равно',
  '>': 'больше',
  '<': 'меньше',
  '>=': 'больше или равно',
  '<=': 'меньше или равно',
}

const deviceImages: Record<string, string> = {
  barrier: barrierImage,
  thermostat: thermostatImage,
  counter: counterImage,
  light: lightImage,
  leak: leakImage,
  fire: fireImage,
  ventilation: ventilationImage,
  elevator: elevatorImage,
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function getDeviceName(device: string) {
  if (device === 'notification') return 'уведомление'
  return deviceNames[device] ?? device
}

export function getDeviceImage(device: string): string | undefined {
  return deviceImages[device]
}

/** число из строки если строка число иначе строка как есть */
export function parseValue(value: string): number | string {
  const trimmed = value.trim()
  const number = Number(trimmed)

  return trimmed !== '' && Number.isFinite(number) ? number : trimmed
}
