import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Без vitest globals testing-library не чистит DOM сам: делаем это после каждого теста.
afterEach(cleanup)

// jsdom не реализует matchMedia (его использует Layout): десктопный экран, ничего не совпадает.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})
