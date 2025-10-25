import '@testing-library/jest-dom'

// 模拟 localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// 模拟 fetch API
global.fetch = vi.fn()

// 清理每个测试后的状态
afterEach(() => {
  vi.clearAllMocks()
})