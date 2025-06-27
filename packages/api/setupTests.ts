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

// Mock the JobService - ensuring the mock is hoisted properly
vi.mock('./src/jobs/service', () => {
  const mockJobsStore = new Map();
  let mockJobIdCounter = 1;

  const mockFunctions = {
    createJob: vi.fn(async (data) => {
      console.log('Mock createJob called with:', data);
      const newJob = {
        id: `job-${mockJobIdCounter++}`,
        ...data,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Mock createJob returning:', newJob);
      mockJobsStore.set(newJob.id, newJob);
      return newJob;
    }),
    getJob: vi.fn(async (id) => {
      console.log('Mock getJob called with:', id);
      const job = mockJobsStore.get(id) || null;
      console.log('Mock getJob returning:', job);
      return job;
    }),
    updateJob: vi.fn(async (id, data) => {
      const job = mockJobsStore.get(id);
      if (job) {
        const updatedJob = { ...job, ...data, updatedAt: new Date() };
        mockJobsStore.set(id, updatedJob);
        return updatedJob;
      }
      return null;
    }),
  };

  return mockFunctions;
});

// Mock OpenAI provider
vi.mock('./src/providers/openai', () => {
  console.log('Setting up OpenAI provider mock');
  return {
    OpenAIProvider: {
      name: 'openai',
      models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo-preview'],
      complete: vi.fn().mockImplementation(async function* () {
        console.log('Mock OpenAI complete called');
        yield 'mocked ';
        yield 'openai ';
        yield 'response';
      }),
    },
  };
});

// Mock Gemini provider
vi.mock('./src/providers/gemini', () => {
  console.log('Setting up Gemini provider mock');
  return {
    GeminiProvider: {
      name: 'gemini',
      models: ['gemini-pro'],
      complete: vi.fn().mockImplementation(async function* () {
        console.log('Mock Gemini complete called');
        yield 'mocked ';
        yield 'gemini ';
        yield 'response';
      }),
    },
  };
});

// Use in-memory SQLite DB for all tests
beforeAll(() => {
  process.env.DATABASE_URL = ':memory:';
});
