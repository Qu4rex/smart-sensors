import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useOutletContext } from 'react-router-dom'

import { createStoredDevice, deleteStoredDevice, getDeviceDetails, listDeviceTemplates, listStoredDevices, sendDeviceCommand, updateStoredDevice, type DeviceDetails, type DeviceTemplate } from '../api/devices'
import barrierImage from '../assets/barrier.png'
import counterImage from '../assets/counter.png'
import elevatorImage from '../assets/elevator.png'
import fireImage from '../assets/fire.png'
import leakImage from '../assets/leak.png'
import lightImage from '../assets/light.png'
import thermostatImage from '../assets/thermostat.png'
import ventilationImage from '../assets/ventilation.png'
import type { LayoutContext } from '../components/Layout/Layout'

type DeviceType = string

type Device = {
  id: number
  name: string
  templateKey: string
  room: string | null
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

const hiddenDetailSignals: Record<string, Set<string>> = {
  barrier: new Set(['open_cmd', 'close_cmd']),
  leak: new Set(['self_test']),
  fire: new Set(['self_test']),
  elevator: new Set(['floor_changed', 'emergency_btn']),
}

function DeviceIcon({ type }: { type: DeviceType }) {
  if (type === 'barrier') return <span className="device-icon device-icon--barrier" aria-hidden="true" />

  const detailedIcons: Record<string, ReactNode> = {
    ventilation: <path d="M213.1 74.08c6.79-8.03 13.88-13.54 23.86-17.17 31.09-11.14 65.66-5.07 94.47 9.67 19.71 10.14 38.66 25.34 51.46 43.54 8.34 11.61 2.3 26.96-11.35 30.41l-22.59 5.38c-15.59 3.67-29.2 12.44-38.36 25.65-7.2 10.4-13.36 21.97-18.54 33.5-2.71 6.2-5.68 13.22-7.52 19.69 3.31-1.2 6.89-3.56 10.18-5.07 20.1-9.93 41.81-17.54 64.07-20.67 20.87-2.98 42.25-1.95 62.3 4.86 16.51 5.83 29.46 18.49 34.73 35.3 15.26 46.24-6.19 99.97-40.18 132.46-4.62 4.36-10.2 9.06-15.52 12.49-11.09 6.53-25.03.52-28.43-11.73l-5.61-23.43c-3.75-15.67-12.38-29.06-25.66-38.3-11.16-7.65-23.22-14.03-35.62-19.45-5.55-2.31-11.92-5.16-17.73-6.55l1.48 2.85c6.6 12.38 12.21 25.02 16.59 38.37 10.13 30.33 13.49 64.56 3.01 95.25-3.79 10.53-9.61 18.63-18.17 25.78-5.69 4.29-10.94 7.13-17.79 9.23-38.21 12.24-81.13-.62-112.55-23.79-11.97-8.81-22.27-18.91-30.84-31.09-7.65-10.93-1.8-26.06 10.93-29.57l23.41-5.6c16.1-3.88 29.31-12.51 38.73-26.19 6.87-10.08 12.8-21.11 17.83-32.21 2.87-6.51 5.84-13.61 7.89-20.39-3 .94-6.58 3.39-9.6 4.69-38.17 19.14-84.66 30.32-126.32 16.39-16.16-5.5-29.46-17.78-35.01-34.08-16.7-48 6.76-104.77 43.41-137.25 4.91-3.96 11.29-10.16 17.61-11.36 5.86-1.11 10.5.18 15.42 3.33 4.98 4.27 6.65 7.47 8.04 13.87l4.8 20.23c3.73 15.69 12.39 29.05 25.66 38.31 10.48 7.18 21.9 13.33 33.48 18.51 6.19 2.7 13.22 5.68 19.67 7.52-.27-1.42-1.04-2.31-1.63-3.57-8.49-15.93-15.3-32.56-19.93-50.02-6.95-26.7-8.42-54.94.2-81.45 2.18-6.94 5.4-12.57 9.72-18.34zM272.06 236.02l-1.79-1.21c-14.4-9.71-33.68-2.58-38.76 13.77-2.43 8.72-.78 16.31 4.52 23.48 3.61 4.05 7.31 6.79 12.56 8.42 8.73 2.44 16.28.77 23.46-4.51 5.59-4.95 8.74-10.43 9.45-17.99.52-9.06-2.77-16.06-9.44-21.96z" />,
    fire: <><path d="M225.79 80.79c2.58 7.1 4.42 13.67 5.14 21.24 3.45 35.58-18.88 67.46-40.34 93.58-19.55 23.64-41.29 45.49-60.49 69.43-16.98 21.6-34.56 47.46-35.22 75.9-.34 20.27 4.12 40.95 13 59.19 10.08 20.82 26.6 40.34 46.01 53 5.15 3.3 12.25 5.43 9.89 13.28-2.13 5.5-7.93 6.78-12.71 3.67-15.06-8.42-28.83-21.14-39.63-34.52-21.01-26.29-32.32-57.86-32.57-91.57-.43-27.31 11.98-51.96 27.37-73.74 8.6-12.36 18.2-23.69 28.1-35.02 14.25-16.36 29.21-32.14 43.1-48.8 12.98-15.83 26.24-33.29 33.32-52.67 8.07-22.1 5.25-42.35-7.74-61.74-2.58-4.55-8.45-8.72-6.12-14.54 2.24-5.33 7.49-6.43 12.34-3.85 23.82 10.45 45.21 26.31 61.87 46.31 23.81 28.4 38.6 67.26 29.01 104.26-3.16 12.57-10.17 24.78-17.78 35.17-8.5 10.62-16.59 22.27-16.29 36.53.65 13.74 15.38 26.29 28.91 26.22 15.95.1 29.55-7.44 33.56-23.58 2.4-9.14 1.27-20.06-1.14-29.1-2.16-7.36 4.03-13.43 11.27-10.24 15.13 6.31 28.43 20.22 37.72 33.45 23.26 33.41 33.52 76.91 22.99 116.71-8.81 33.5-30.58 59.84-58.26 79.83-4.29 3.65-9.93 3.62-13.12-1.4-2.57-4.93-.35-9.07 3.99-11.79 18.7-13.45 34.72-30.36 44.76-51.26 16.69-34.41 12.96-74.66-4.45-108.01-6.51-12.48-15.59-25.29-26.51-34.27.36 8.87-.23 16.63-3.28 25.07-7.56 21.02-27.75 31.46-49.39 30.53-22.93-1.15-44.63-22.15-42.99-45.78 1.6-26.13 24.42-42.93 32.77-66.45 8.69-24.19 2.96-51.61-9.08-73.63-11.23-20.67-28.37-38.56-48.01-51.41z" /><path d="M197.74 337.19c.41 15.88-5.78 31.09-12.26 45.29-5.49 11.52-6.74 22.56-2.79 34.83 4.86 15.4 16.74 28.9 28.26 39.84 8.78 8.12-1.85 20.02-10.85 11.83-14.19-13.2-27.91-29.89-33.25-48.84-4.73-16.38-2.39-30.44 4.62-45.66 6.6-14.21 12.06-27.17 9.39-43.3-.22-4.01-3.41-9.76-2.17-13.47 1.97-5.73 7.65-7.08 12.71-4.25 24.41 11.41 37.95 35.83 42.58 61.51 1.32 7.14 1.76 13.95 1.88 21.17.42 13.12 10.82 19.57 23.02 19.65 17.98-.22 31.73-13.52 36.9-30.04 1.71-4.82 1.51-11.21 7.65-12.65 9.13-1.89 10.55 7.87 12.28 14.32 6.34 28.61.32 68.37-28.58 82.89-3.65 2.01-7.4 2.13-10.56-.88-4.04-4.32-2.67-10.62 2.69-13.1 5.56-2.71 9.32-6.08 12.93-11.1 7.25-10.71 9.58-23.35 9.88-36.07-1.99 1.55-3.23 4.01-5.16 5.76-14.56 15.72-39.26 22.19-58.69 11.85-11.96-6.47-18.46-18.21-18.39-31.75-.06-16.06-4.05-33.4-12.86-46.99-1.97-3.03-6.35-9.03-9.23-10.84z" /></>,
    thermostat: <><path d="M194.01 266.05c-.03-13.37.02-26.77-.03-40.14-.35-5.34 2.4-9.53 8.03-9.77 5.62.26 8.34 4.45 8.01 9.77-.03 14.06-.03 28.15 0 42.21.27 8.36-3.32 8.64-9.25 12.62-42.68 28.22-57.17 84.36-33.31 129.79 19.76 37.43 60.47 58.3 102.48 52.49 45.11-5.89 77.96-40.9 84.56-85.34 5.93-39.98-11.83-77.98-46.36-98.86-7.75-4.17-5.9-7.99-6.14-15.74l.01-166.13c.3-13.35-3.44-24.58-12.52-34.44-16.53-17.7-44.28-19.37-62.87-3.87-11.35 9.67-16.87 22.41-16.62 37.3.02 28.05-.03 56.11.02 84.16.39 5.45-2.17 9.83-8.02 10.11-5.85-.27-8.42-4.65-8.02-10.11.05-27.71.01-55.43.01-83.14-.17-29.64 15.69-54.09 44.75-62.24 27.08-7.37 57.47 3.25 71.17 28.39 5.49 9.96 8.01 21.52 8.1 32.84l-.01 53.05-.01 117.05c17.17 11.07 30.97 25.27 40.61 43.37 32.55 61.53 1.66 142.4-64.78 164.44-40.21 13.33-86.09 4.77-116.88-24.88-43.84-42.05-49.88-113.92-9.28-160.35 7.81-8.94 16.41-16.14 26.35-22.58z" /><path d="M229.87 288.57c.2-1.22.11-2.38.13-3.61V105.97c.24-8.7-2.31-18.1 9.91-17.99 10.71.03 21.47.03 32.18 0 12.21-.11 9.67 9.29 9.91 17.99v126.13c.08 5.5.77 11.37-5.64 13.52-4.77 1.48-9.8-1.77-10.26-6.77-.23-2.25-.07-4.5-.1-6.75V104h-20v182.06c-.25 8.56 1.94 14.17-8.19 16.73-30.52 8.94-49.8 39.19-45.07 70.69 5.44 35.67 38.79 59.69 74.43 53.49 31.29-5.16 51.99-31.72 52.37-62.96.22-29.17-17.49-52.93-45.36-61.24-9.65-2.48-8.07-7.33-8.18-15.74.17-6.6-1.84-15.6 7.2-16.9 4.81-.39 8.65 3.09 8.78 7.92.17 3.49-.18 7.02.14 10.52 8.05 2.53 15.04 6.61 21.89 11.45 7.13 5.59 12.91 11.42 18.04 18.95 9.01 13.12 13.95 29.12 13.9 45.04-.48 15.79-5.11 32.72-14.13 45.83-28.39 42.24-93.53 45.13-126.48 6.78l-2.25-2.64-1.66-2.34c-8.54-11.82-13.2-25.56-14.83-39.98-4.18-36.3 18.76-71.55 53.27-83.09z" /></>,
    elevator: <path d="M46.05 455.7c.05-1.56.02-3.13.03-4.7V59.95l-.03-7.02c-.26-8.98 6.62-6.5 12.87-6.86h400.15c8.97-.23 6.48 6.62 6.85 12.88V451c.01 1.57-.02 3.14.03 4.7 4.48.14 12.72-1.66 12.78 5.26-.38 6.91-9.18 4.59-13.67 4.97H46.95c-4.49-.39-13.3 1.94-13.67-4.97.04-6.92 8.3-5.11 12.78-5.26zM81.93 81.94v373.77h168.95V81.94zm179.18 0v373.77h168.94V81.94zM340.32 307.47V197.9c.08-4.17-1.16-10.37 4.71-11 4.98-.08 5.85 4 5.55 8.05v108.06c.02 1.49-.06 2.97.05 4.46 5.42-5.2 10.69-10.63 15.99-15.95 2.56-2.67 5.73-3.43 8.44-.41 3.9 4.85-2.39 8.6-5.23 11.8l-19.01 19.05c-5.7 6.1-8.06 2.38-12.66-2.17l-19.62-19.43c-2.76-2.51-5.5-5.48-2.57-9.17 2.68-2.93 5.76-2.28 8.32.34 5.29 5.32 10.61 10.7 15.99 15.94zM148.6 204.45c-3.92 3.3-7.48 7.39-11.21 10.93-3.49 2.83-7.73 10.59-12.83 5.98-2.99-2.95-1.64-6.14 1.07-8.6l20.08-20.02c4.22-4.06 6.99-9.02 12.63-3.23l19.53 19.58c2.86 3.21 9.12 6.93 5.24 11.79-2.72 3.08-5.84 2.2-8.4-.46-5.28-5.29-10.54-10.71-15.94-15.88-.1 1.49-.04 2.96-.05 4.45v108.08c.23 3.76-.35 7.41-4.83 7.95-4.76-.01-5.76-3.88-5.46-7.84.07-35.73.01-71.46.03-107.2.03-1.85-.09-3.68.12-5.53z" />,
    light: <path d="M222.31 512c-11.36-1.24-19.72-7.17-25.28-17.05-6.32-11.23-4.88-23.61-5.03-35.96-.03-10.67.07-21.37-.05-32.03-.59-22.59-13.47-42.32-30.69-56.11-29.43-23.88-48.06-57.16-53.06-94.74-1.52-11.36-2.03-22.51-.74-33.93 6.72-65.94 56.89-120.11 121.79-132.77 26.9-5.43 54.54-2.25 80.15 7.22 37.27 13.78 66.31 42.33 82.62 78.35 15.24 33.57 17.35 71.28 6.37 106.45-5.94 19.01-15.56 36.25-28.7 51.23-6.61 7.61-13.94 13.93-21.81 20.18-17.04 14.27-27.69 35.79-27.87 58.11l-.01 48.12c.01 5.57-1.06 10.33-3.67 15.26-5.72 10.47-15.58 17.05-27.58 17.67h-66.44zM298.76 426.72c1.27-19.1 8.1-36.35 19.06-51.92 6.17-8.66 13.17-15.84 21.44-22.49 30.11-24.84 46.08-62.48 44.62-101.36-1.14-29.99-12.19-57.35-31.94-79.88-25.4-29.39-62.3-44.42-100.98-42.94-60.76 2.45-112.34 50.76-121.51 110.4-4.66 29.81 3.11 63.15 19.75 88.29 7.24 10.96 15.64 20.03 26.06 28.02 22.47 17.52 37.45 42.94 38 71.86h86.5zM213.26 448.08c.26 9.74-.15 19.67.22 29.38.68 7.49 2.98 13.4 11.56 13.22h61.85c7.12.17 11.64-3.63 11.77-10.88.08-10.53-.11-21.18.08-31.72-8.5-.18-17.21-.03-25.74-.08h-55c-1.59.01-3.16-.05-4.74.08z" />,
    leak: <path d="M240.12 0h3.94c4.89 2.28 5.79 4.01 8.61 8.34l76.89 114.15c.95 1.47 2 2.74 2.72 4.36 2.52-1.64 4.25-5.91 6.26-8.34l20.11-29.89c4.85-7.64 13.75-7.4 18.43.28l64.8 96.22c14.96 22.25 18.83 50.87 10.58 76.37-5.08 15.58-13.73 28.57-25.89 39.51 1.19 10.1 1.84 19.77 1.46 29.96-.92 33.63-11.05 66.52-29.24 94.82-16.2 25.36-38.39 46.55-64.51 61.51-19.81 11.41-41 18.84-63.58 22.43-8.78 1.47-17.38 1.96-26.25 2.28h-5.93c-7.13-.3-14.03-.62-21.12-1.67-34.68-4.41-67.56-18.95-94.48-41.21-9.91-8.24-18.68-17.22-26.81-27.21-5.67-7.27-10.82-14.56-15.45-22.57-8.08-13.81-14.15-28.11-18.47-43.52-11.63-41.27-8.54-86.51 8.94-125.69 5.25-11.87 11.74-23.12 19.35-33.63l5.68-8.36L229.39 10.38c3.57-4.89 4.33-8.56 10.73-10.38zM240.98 28.17c.08 1.68-1.63 2.95-2.36 4.39L105.71 229.69c-16.68 23.47-26.87 50.93-29.61 79.6-6.67 67.99 28.95 132.83 89.46 164.12 52.25 27.11 115.8 24.29 165.36-7.5 21.83-13.88 40.45-33.06 53.7-55.28 13.81-23.19 21.6-48.65 23.19-75.61.41-7.14.29-14.06-.07-21.17-5.25 2.35-10.2 4.52-15.8 6.04-39.69 11.21-81.58-6.32-101.75-42.09-16.25-28.53-15-65.07 3.25-92.36l27.14-40.08-77.13-114.83c-.95-1.32-.89-1.8-2.47-2.36zM367.56 111.08l-54.83 81.63c-6 8.32-10.01 16.57-12.26 26.64-8.25 37.49 15.53 74.19 52.85 82.32 47.48 10.06 90.18-30.62 82.45-78.53-1.85-11.08-5.85-20.43-12.36-29.54l-51.94-77.09c-1.34-1.82-2.3-3.84-3.91-5.43z" />,
  }

  if (detailedIcons[type]) {
    return <svg className="device-icon" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">{detailedIcons[type]}</svg>
  }

  const paths: Record<string, ReactNode> = {
    barrier: null,
    thermostat: null,
    counter: <><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 10h8M8 14h1m3 0h1m3 0h1" /></>,
    light: null,
    leak: null,
    fire: null,
    ventilation: null,
    elevator: null,
  }

  return <svg className="device-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type] ?? <rect x="4" y="4" width="16" height="16" rx="4" />}</svg>
}

function DeviceState({ type, state }: { type: DeviceType; state: Record<string, unknown> }) {
  const value = (name: string) => state[name]
  const number = (name: string): number | string => {
    const signalValue = value(name)
    return typeof signalValue === 'number' ? signalValue : '—'
  }

  if (type === 'barrier') {
    const states: Record<number, string> = { 0: 'Закрыто', 1: 'Открывается', 2: 'Открыто', 3: 'Закрывается', 4: 'Удержание' }
    return <span className="device-card__status">{states[Number(value('state'))] ?? '—'}</span>
  }
  if (type === 'light') return <span className="device-card__status">{Number(value('lamp')) === 1 ? 'Включен' : 'Выключен'}</span>
  if (type === 'thermostat') return <span className="device-card__value">{number('temperature')} <small>°C</small></span>
  if (type === 'counter') return <span className="device-card__value">{number('total')} <small>кВт·ч</small></span>
  if (type === 'leak') return <span className={Number(value('leak')) === 1 ? 'device-card__status device-card__status--alert' : 'device-card__status'}>{Number(value('leak')) === 1 ? 'Протечка' : 'Протечки нет'}</span>
  if (type === 'elevator') return <span className="device-card__value">{number('floor_current')} <small>этаж</small></span>
  if (type === 'ventilation') return <span className="device-card__value">{number('co2')} <small>ppm</small></span>
  if (type === 'fire') return <span className="device-card__value">{number('smoke')} <small>%</small></span>
  return <span className="device-card__value">—</span>
}

function DeviceSwitch({ type, state, onToggle }: { type: string; state: Record<string, unknown>; onToggle: () => void }) {
  const isOn = type === 'light' ? Number(state.lamp) === 1 : Number(state.state) !== 0
  const label = type === 'light' ? (isOn ? 'Выключить светильник' : 'Включить светильник') : (isOn ? 'Закрыть шлагбаум' : 'Открыть шлагбаум')
  return <button className={`device-card__switch${isOn ? ' device-card__switch--on' : ''}`} type="button" role="switch" aria-checked={isOn} aria-label={label} onClick={onToggle}><span /></button>
}

export default function Page1() {
  const { rooms, addRoom } = useOutletContext<LayoutContext>()
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceOptions, setDeviceOptions] = useState<DeviceTemplate[]>([])
  const [controlOverrides, setControlOverrides] = useState<Record<string, boolean>>({})
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null)
  const [deviceName, setDeviceName] = useState('')
  const [deviceRoom, setDeviceRoom] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [deviceDetails, setDeviceDetails] = useState<DeviceDetails | null>(null)
  const [detailsError, setDetailsError] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedRoom, setEditedRoom] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [targetTemperature, setTargetTemperature] = useState('')
  const [isSavingTargetTemperature, setIsSavingTargetTemperature] = useState(false)
  const [targetCo2, setTargetCo2] = useState('')
  const [isSavingTargetCo2, setIsSavingTargetCo2] = useState(false)
  const [fanSpeed, setFanSpeed] = useState('')
  const [isSavingFanSpeed, setIsSavingFanSpeed] = useState(false)
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [templatesError, setTemplatesError] = useState('')
  const [activeRoom, setActiveRoom] = useState<number | 'all'>('all')
  const [isRoomOpen, setIsRoomOpen] = useState(false)
  const [roomName, setRoomName] = useState('')

  useEffect(() => {
    const loadTemplates = () => {
      listDeviceTemplates()
        .then((templates) => {
          setDeviceOptions(templates)
          setControlOverrides((current) => {
            const remaining = { ...current }
            templates.forEach((template) => {
              const desired = current[template.key]
              if (desired === undefined) return
              const actual = template.key === 'light'
                ? Number(template.state.lamp) === 1
                : template.key === 'barrier' && Number(template.state.state) !== 0
              if (actual === desired) delete remaining[template.key]
            })
            return remaining
          })
          setTemplatesError('')
        })
        .catch(() => setTemplatesError('Не удалось загрузить шаблоны устройств'))
    }

    loadTemplates()
    const interval = window.setInterval(loadTemplates, 3000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    listStoredDevices()
      .then((storedDevices) => {
        setDevices(storedDevices.map((device) => ({
          id: device.id,
          name: device.name,
          templateKey: device.device_type,
          room: device.room,
        })))
      })
      .catch(() => undefined)
  }, [])

  const openAddDialog = () => {
    setSelectedTemplate(null)
    setDeviceName('')
    setDeviceRoom(activeRoom === 'all' ? '' : rooms.find((room) => room.id === activeRoom)?.name || '')
    setIsAddOpen(true)
  }

  const addDevice = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedTemplate || !deviceName.trim()) return
    const storedDevice = await createStoredDevice({
      name: deviceName.trim(),
      device_type: selectedTemplate.key,
      room: deviceRoom || null,
    })
    setDevices((current) => [...current, {
      id: storedDevice.id,
      name: storedDevice.name,
      templateKey: storedDevice.device_type,
      room: storedDevice.room,
    }])
    setIsAddOpen(false)
    setShowToast(true)
    window.setTimeout(() => setShowToast(false), 3000)
  }

  const createRoom = async (event: FormEvent) => {
    event.preventDefault()
    const name = roomName.trim()
    if (!name) return
    try {
      const room = await addRoom(name)
      setActiveRoom(room.id)
      setRoomName('')
      setIsRoomOpen(false)
    } catch {
      setTemplatesError('Не удалось сохранить комнату')
    }
  }

  const loadDeviceDetails = (device: Device) => {
    setDeviceDetails(null)
    setDetailsError('')
    getDeviceDetails(device.templateKey)
      .then((details) => {
        setDeviceDetails(details)
        if (device.templateKey === 'thermostat') setTargetTemperature(String(details.state.target_temp ?? ''))
        if (device.templateKey === 'ventilation') setTargetCo2(String(details.state.co2_target ?? ''))
        if (device.templateKey === 'ventilation') setFanSpeed(String(details.state.fan_speed ?? ''))
      })
      .catch(() => setDetailsError('Не удалось загрузить данные устройства'))
  }

  const openDeviceDetails = (device: Device) => {
    setSelectedDevice(device)
    setEditedName(device.name)
    setEditedRoom(device.room ?? '')
    setIsEditingName(false)
    setIsDeviceMenuOpen(false)
    loadDeviceDetails(device)
  }

  const toggleDevice = async (template: DeviceTemplate) => {
    const isLight = template.key === 'light'
    const isOn = isLight ? Number(template.state.lamp) === 1 : Number(template.state.state) !== 0
    const signal = isLight ? 'lamp' : isOn ? 'close_cmd' : 'open_cmd'
    const commandValue = isLight ? (isOn ? 0 : 1) : 1
    const nextState = !isOn

    setControlOverrides((current) => ({ ...current, [template.key]: nextState }))

    try {
      await sendDeviceCommand(template.key, signal, commandValue)
    } catch (error) {
      setControlOverrides((current) => {
        const next = { ...current }
        delete next[template.key]
        return next
      })
      setTemplatesError(error instanceof Error ? error.message : 'Не удалось изменить состояние устройства')
    }
  }

  const displayTemplate = (template: DeviceTemplate): DeviceTemplate => {
    const override = controlOverrides[template.key]
    if (override === undefined) return template
    if (template.key === 'light') return { ...template, state: { ...template.state, lamp: override ? 1 : 0 } }
    if (template.key === 'barrier') return { ...template, state: { ...template.state, state: override ? 2 : 0 } }
    return template
  }

  const closeDeviceDetails = () => {
    setSelectedDevice(null)
    setDeviceDetails(null)
    setDetailsError('')
    setIsEditingName(false)
    setIsDeleteConfirmOpen(false)
  }

  const saveDeviceName = async () => {
    if (!selectedDevice || !editedName.trim()) return
    setIsSavingName(true)
    setDetailsError('')
    try {
      const updatedDevice = await updateStoredDevice(selectedDevice.id, { name: editedName.trim(), room: editedRoom || null })
      const updated = { ...selectedDevice, name: updatedDevice.name, room: updatedDevice.room }
      setDevices((current) => current.map((device) => device.id === updated.id ? updated : device))
      setSelectedDevice(updated)
      setIsEditingName(false)
      setIsDeviceMenuOpen(false)
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Не удалось сохранить название')
    } finally {
      setIsSavingName(false)
    }
  }

  const saveTargetTemperature = async () => {
    const value = Number(targetTemperature)
    if (!Number.isFinite(value)) return
    setIsSavingTargetTemperature(true)
    setDetailsError('')
    try {
      const result = await sendDeviceCommand('thermostat', 'target_temp', value)
      setDeviceDetails((current) => current ? { ...current, state: { ...current.state, ...result.state } } : current)
      setDeviceOptions((current) => current.map((device) => device.key === 'thermostat' ? { ...device, state: { ...device.state, ...result.state } } : device))
      setTargetTemperature(String(result.state.target_temp ?? value))
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Не удалось изменить целевую температуру')
    } finally {
      setIsSavingTargetTemperature(false)
    }
  }

  const saveTargetCo2 = async () => {
    const value = Number(targetCo2)
    if (!Number.isFinite(value)) return
    setIsSavingTargetCo2(true)
    setDetailsError('')
    try {
      const result = await sendDeviceCommand('ventilation', 'co2_target', value)
      setDeviceDetails((current) => current ? { ...current, state: { ...current.state, ...result.state } } : current)
      setDeviceOptions((current) => current.map((device) => device.key === 'ventilation' ? { ...device, state: { ...device.state, ...result.state } } : device))
      setTargetCo2(String(result.state.co2_target ?? value))
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Не удалось изменить целевой CO₂')
    } finally {
      setIsSavingTargetCo2(false)
    }
  }

  const saveFanSpeed = async () => {
    const value = Number(fanSpeed)
    if (!Number.isInteger(value) || value < 0 || value > 6) return
    setIsSavingFanSpeed(true)
    setDetailsError('')
    try {
      await sendDeviceCommand('ventilation', 'mode', 2)
      const result = await sendDeviceCommand('ventilation', 'fan_speed', value)
      setDeviceDetails((current) => current ? { ...current, state: { ...current.state, ...result.state } } : current)
      setDeviceOptions((current) => current.map((device) => device.key === 'ventilation' ? { ...device, state: { ...device.state, ...result.state } } : device))
      setFanSpeed(String(result.state.fan_speed ?? value))
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Не удалось изменить скорость вентилятора')
    } finally {
      setIsSavingFanSpeed(false)
    }
  }

  const removeDevice = async () => {
    if (!selectedDevice) return
    setIsDeleting(true)
    setDetailsError('')
    try {
      await deleteStoredDevice(selectedDevice.id)
      setDevices((current) => current.filter((device) => device.id !== selectedDevice.id))
      closeDeviceDetails()
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : 'Не удалось удалить устройство')
      setIsDeleteConfirmOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const selectedRoom = activeRoom === 'all' ? null : rooms.find((room) => room.id === activeRoom)
  const visibleDevices = selectedRoom
    ? devices.filter((device) => device.room === selectedRoom.name)
    : devices

  const formatSignalValue = (signal: NonNullable<DeviceDetails>['declaration'][number]) => {
    if (!deviceDetails) return ''
    const value = deviceDetails.state[signal.name]
    const label = signal.layout?.[String(value)]
    if (label) return label
    return signal.measure ? `${String(value)} ${signal.measure}` : String(value)
  }

  return (
    <section className="panel panel--with-add devices-panel" aria-label="Устройства">
      <div className="room-tabs__scroll">
        <nav className="room-tabs" aria-label="Комнаты устройств">
          <button className={activeRoom === 'all' ? 'room-tabs__item room-tabs__item--active' : 'room-tabs__item'} type="button" onClick={() => setActiveRoom('all')}>Все устройства</button>
          {rooms.map((room) => (
            <button className={activeRoom === room.id ? 'room-tabs__item room-tabs__item--active' : 'room-tabs__item'} key={room.id} type="button" onClick={() => setActiveRoom(room.id)}>{room.name}</button>
          ))}
          <button className="room-tabs__add" type="button" aria-label="Добавить комнату" onClick={() => setIsRoomOpen(true)}>+</button>
        </nav>
      </div>

      {visibleDevices.length === 0 ? <p className="panel__text devices-panel__empty">Нет добавленных устройств</p> : (
        <div className="device-grid">
          {visibleDevices.map((device) => {
            const deviceTemplate = deviceOptions.find(({ key }) => key === device.templateKey)
            if (!deviceTemplate) return null
            const template = displayTemplate(deviceTemplate)
            return (
              <article className="device-card" key={device.id}>
                <div className="device-card__content">
                  <h2 className="device-card__name">{device.name}</h2>
                  {(template.key === 'light' || template.key === 'barrier') && <DeviceSwitch type={template.key} state={template.state} onToggle={() => toggleDevice(template)} />}
                  <DeviceState type={template.key} state={template.state} />
                </div>
                {deviceImages[template.key] ? (
                  <img className="device-card__image" src={deviceImages[template.key]} alt="" />
                ) : (
                  <div className="device-card__icon"><DeviceIcon type={template.key} /></div>
                )}
                <button className="device-card__details" type="button" aria-label={`Открыть ${device.name}`} onClick={() => openDeviceDetails(device)}>↘</button>
              </article>
            )
          })}
        </div>
      )}

      <button className="panel__add" type="button" aria-label="Добавить устройство" onClick={openAddDialog}>+</button>

      {isAddOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsAddOpen(false)}>
          <section className="device-modal" role="dialog" aria-modal="true" aria-labelledby="add-device-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="add-device-title">Добавить устройство</h1>
              <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={() => setIsAddOpen(false)}>×</button>
            </div>
            <form onSubmit={addDevice}>
              <div className="device-picker" aria-label="Тип устройства">
                {deviceOptions.map((option) => (
                  <button className={selectedTemplate?.key === option.key ? 'device-picker__item device-picker__item--selected' : 'device-picker__item'} key={option.key} type="button" onClick={() => setSelectedTemplate(option)}>
                    <DeviceIcon type={option.key} />
                    <span>{option.title}</span>
                  </button>
                ))}
              </div>
              {templatesError && <p className="device-modal__error">{templatesError}</p>}
              <label className="device-modal__field">
                <span>Название устройства</span>
                <input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} placeholder="Например, лампа в спальне" maxLength={64} autoFocus />
              </label>
              <label className="device-modal__field">
                <span>Комната</span>
                <select value={deviceRoom} onChange={(event) => setDeviceRoom(event.target.value)}>
                  <option value="">Не выбрана</option>
                  {rooms.map((room) => <option key={room.id} value={room.name}>{room.name}</option>)}
                </select>
              </label>
              <button className="device-modal__submit" type="submit" disabled={!selectedTemplate || !deviceName.trim()}>Добавить</button>
            </form>
          </section>
        </div>
      )}

      {isRoomOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsRoomOpen(false)}>
          <section className="device-modal device-modal--compact" role="dialog" aria-modal="true" aria-labelledby="add-room-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="add-room-title">Добавить комнату</h1>
              <button type="button" className="device-modal__close" aria-label="Закрыть" onClick={() => setIsRoomOpen(false)}>×</button>
            </div>
            <form onSubmit={createRoom}>
              <label className="device-modal__field device-modal__field--first">
                <span>Название комнаты</span>
                <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder="Например, гостиная" maxLength={64} autoFocus />
              </label>
              <button className="device-modal__submit" type="submit" disabled={!roomName.trim()}>Добавить</button>
            </form>
          </section>
        </div>
      )}

      {selectedDevice && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeDeviceDetails}>
          <section className="device-modal device-modal--details" role="dialog" aria-modal="true" aria-labelledby="device-details-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <button type="button" className="device-modal__back" aria-label="Закрыть окно устройства" onClick={closeDeviceDetails}>←</button>
              {isEditingName ? (
                <div className="device-modal__name-editor">
                  <input id="device-details-title" className="device-modal__name-input" value={editedName} onChange={(event) => setEditedName(event.target.value)} maxLength={64} aria-label="Название устройства" autoFocus />
                </div>
              ) : (
                <h1 id="device-details-title">{selectedDevice.name}</h1>
              )}
              <div className="device-modal__menu">
                <button type="button" className="device-modal__more" aria-label="Действия с устройством" aria-expanded={isDeviceMenuOpen} onClick={() => setIsDeviceMenuOpen((open) => !open)}>
                  <span /><span /><span />
                </button>
                {isDeviceMenuOpen && !isEditingName && (
                  <div className="device-modal__menu-list">
                    <button type="button" onClick={() => { setIsEditingName(true); setIsDeviceMenuOpen(false) }}>Изменить</button>
                    <button type="button" className="device-modal__menu-delete" onClick={() => { setIsDeleteConfirmOpen(true); setIsDeviceMenuOpen(false) }}>Удалить</button>
                  </div>
                )}
              </div>
            </div>
            {deviceDetails && <p className="device-modal__subtitle">{deviceDetails.title}</p>}
            {detailsError && <p className="device-modal__error">{detailsError}</p>}
            {!deviceDetails && !detailsError && <p className="device-modal__loading">Загружаем данные…</p>}
            {deviceDetails && (
              <dl className="device-details">
                <div className="device-details__row">
                  <dt>Комната</dt>
                  {isEditingName ? (
                    <dd><select className="device-details__room-select" value={editedRoom} onChange={(event) => setEditedRoom(event.target.value)} aria-label="Комната устройства">
                      <option value="">Не выбрана</option>
                      {rooms.map((room) => <option key={room.id} value={room.name}>{room.name}</option>)}
                    </select></dd>
                  ) : (
                    <dd>{selectedDevice.room ?? 'Не выбрана'}</dd>
                  )}
                </div>
                {deviceDetails.declaration.filter((signal) => signal.name !== 'fw' && !hiddenDetailSignals[selectedDevice.templateKey]?.has(signal.name)).map((signal) => (
                  <div className="device-details__row" key={signal.name}>
                    <dt>{signal.title}</dt>
                    {selectedDevice.templateKey === 'thermostat' && signal.name === 'target_temp' ? (
                      <dd className="device-details__target-control">
                        <input type="number" min="5" max="35" step="0.1" value={targetTemperature} onChange={(event) => setTargetTemperature(event.target.value)} aria-label="Целевая температура" />
                        <span>°C</span>
                        <button type="button" onClick={saveTargetTemperature} disabled={isSavingTargetTemperature || targetTemperature === ''}>ОК</button>
                      </dd>
                    ) : selectedDevice.templateKey === 'ventilation' && signal.name === 'co2_target' ? (
                      <dd className="device-details__target-control">
                        <input type="number" min="400" max="1400" step="10" value={targetCo2} onChange={(event) => setTargetCo2(event.target.value)} aria-label="Целевой CO₂" />
                        <span>ppm</span>
                        <button type="button" onClick={saveTargetCo2} disabled={isSavingTargetCo2 || targetCo2 === ''}>ОК</button>
                      </dd>
                    ) : selectedDevice.templateKey === 'ventilation' && signal.name === 'fan_speed' ? (
                      <dd className="device-details__target-control">
                        <input type="number" min="0" max="6" step="1" value={fanSpeed} onChange={(event) => setFanSpeed(event.target.value)} aria-label="Скорость вентилятора" />
                        <button type="button" onClick={saveFanSpeed} disabled={isSavingFanSpeed || fanSpeed === ''}>ОК</button>
                      </dd>
                    ) : <dd>{formatSignalValue(signal)}</dd>}
                  </div>
                ))}
              </dl>
            )}
            {isEditingName && <button type="button" className="device-modal__save" onClick={saveDeviceName} disabled={isSavingName || !editedName.trim()}>Сохранить</button>}
          </section>
        </div>
      )}

      {isDeleteConfirmOpen && selectedDevice && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsDeleteConfirmOpen(false)}>
          <section className="device-modal device-modal--compact" role="dialog" aria-modal="true" aria-labelledby="delete-device-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="device-modal__header">
              <h1 id="delete-device-title">Удалить устройство?</h1>
            </div>
            <p className="device-modal__confirm-text">«{selectedDevice.name}» будет удалено без возможности восстановления.</p>
            <div className="device-modal__confirm-actions">
              <button className="device-modal__cancel" type="button" onClick={() => setIsDeleteConfirmOpen(false)}>Отмена</button>
              <button className="device-modal__confirm-delete" type="button" onClick={removeDevice} disabled={isDeleting}>{isDeleting ? 'Удаляем…' : 'Удалить'}</button>
            </div>
          </section>
        </div>
      )}

      {showToast && <div className="device-toast" role="status">Устройство добавлено</div>}
    </section>
  )
}
