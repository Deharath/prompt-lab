import { vi, beforeAll } from 'vitest';
import Database from 'better-sqlite3';

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
