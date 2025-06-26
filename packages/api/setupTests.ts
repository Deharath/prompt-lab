import { vi, beforeAll } from 'vitest';

// Mock better-sqlite3 to avoid native module compilation issues in CI
vi.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: vi.fn(() => ({
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(() => []),
      bind: vi.fn(),
      finalize: vi.fn(),
    })),
    close: vi.fn(),
    exec: vi.fn(),
    transaction: vi.fn((fn) => fn),
  };
  
  return {
    default: vi.fn(() => mockDb),
  };
});

// Mock drizzle database operations
vi.mock('./src/db/index.ts', () => {
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
        orderBy: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 1 }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve({ changes: 1 })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve({ changes: 1 })),
    })),
  };
  
  return { db: mockDb };
});

// Mock OpenAI provider
vi.mock('./providers/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'mocked response' } }] }),
      }
    }
  }
}));

// Mock Gemini provider
vi.mock('./providers/gemini', () => ({
  gemini: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'mocked gemini response' } }] }),
      }
    }
  }
}));

// Use in-memory SQLite DB for all tests
beforeAll(() => {
  process.env.DATABASE_URL = ':memory:';
  // If your code uses process.env.DATABASE_URL, this will ensure it uses in-memory DB.
  // If you instantiate Database directly, do: new Database(':memory:')
});
