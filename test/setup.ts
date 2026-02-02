/**
 * Vitest setup file
 * Runs before each test suite
 */

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    openOptionsPage: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
} as any;
