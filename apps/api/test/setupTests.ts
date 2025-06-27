import { vi, beforeAll, afterEach } from 'vitest';

// ================================================================================================
// GLOBAL MOCK FOUNDATION - "Perfect World" Setup
// ================================================================================================

// Mock filesystem operations for datasets
vi.mock('fs/promises', () => {
  const mockReadFile = vi.fn().mockImplementation(async (filePath: string) => {
    // Mock the news-summaries dataset
    if (filePath.includes('news-summaries.jsonl')) {
      return [
        '{"id":"1","input":"Tech stocks rallied today sending the market higher.","expected":"Market climbs as tech stocks rally."}',
        '{"id":"2","input":"The city council approved new green initiatives.","expected":"Council backs new eco measures."}',
        '{"id":"3","input":"Scientists discovered a potential cure for the rare disease.","expected":"New discovery offers hope for curing rare disease."}',
        '{"id":"4","input":"Heavy rains caused flooding across the region.","expected":"Region hit by floods after heavy rains."}',
        '{"id":"5","input":"A local team won the championship after a tense final.","expected":"Local champions triumph in tense final."}',
        '{"id":"6","input":"The government announced tax cuts for small businesses.","expected":"Small businesses to benefit from tax cuts."}',
        '{"id":"7","input":"An ancient shipwreck was found near the coastline.","expected":"Archaeologists uncover ancient shipwreck."}',
        '{"id":"8","input":"The art exhibition attracted thousands of visitors.","expected":"Large crowds drawn to art exhibition."}',
        '{"id":"9","input":"A new restaurant opened offering plant-based dishes.","expected":"Plant-based eatery opens to public."}',
        '{"id":"10","input":"Meteorologists predict a severe storm this weekend.","expected":"Severe storm expected this weekend."}',
        '{"id":"11","input":"The company reported strong quarterly earnings.","expected":"Company posts strong quarterly results."}',
        '{"id":"12","input":"A new book by the famous author topped the bestseller list.","expected":"Author\'s latest book becomes bestseller."}',
        '{"id":"13","input":"The park will be renovated to include new playground equipment.","expected":"Park renovation to feature new playground."}',
        '{"id":"14","input":"Researchers published findings on climate change impact.","expected":"Study reveals climate change effects."}',
        '{"id":"15","input":"The local festival attracted visitors from around the world.","expected":"International visitors flock to local festival."}',
      ].join('\n');
    }
    // For other files, simulate file not found
    const error = new Error('ENOENT: no such file or directory') as unknown;
    (error as { code?: string }).code = 'ENOENT';
    throw error;
  });

  return {
    default: {
      readFile: mockReadFile,
    },
    readFile: mockReadFile,
  };
});

vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    promises: {
      ...((actual as any).promises || {}),
      readFile: vi.fn().mockImplementation(async (filePath: string) => {
        // Mock the news-summaries dataset
        if (filePath.includes('news-summaries.jsonl')) {
          return [
            '{"id":"1","input":"Tech stocks rallied today sending the market higher.","expected":"Market climbs as tech stocks rally."}',
            '{"id":"2","input":"The city council approved new green initiatives.","expected":"Council backs new eco measures."}',
            '{"id":"3","input":"Scientists discovered a potential cure for the rare disease.","expected":"New discovery offers hope for curing rare disease."}',
            '{"id":"4","input":"Heavy rains caused flooding across the region.","expected":"Region hit by floods after heavy rains."}',
            '{"id":"5","input":"A local team won the championship after a tense final.","expected":"Local champions triumph in tense final."}',
            '{"id":"6","input":"The government announced tax cuts for small businesses.","expected":"Small businesses to benefit from tax cuts."}',
            '{"id":"7","input":"An ancient shipwreck was found near the coastline.","expected":"Archaeologists uncover ancient shipwreck."}',
            '{"id":"8","input":"The art exhibition attracted thousands of visitors.","expected":"Large crowds drawn to art exhibition."}',
            '{"id":"9","input":"A new restaurant opened offering plant-based dishes.","expected":"Plant-based eatery opens to public."}',
            '{"id":"10","input":"Meteorologists predict a severe storm this weekend.","expected":"Severe storm expected this weekend."}',
            '{"id":"11","input":"The company reported strong quarterly earnings.","expected":"Company posts strong quarterly results."}',
            '{"id":"12","input":"A new book by the famous author topped the bestseller list.","expected":"Author\'s latest book becomes bestseller."}',
            '{"id":"13","input":"The park will be renovated to include new playground equipment.","expected":"Park renovation to feature new playground."}',
            '{"id":"14","input":"Researchers published findings on climate change impact.","expected":"Study reveals climate change effects."}',
            '{"id":"15","input":"The local festival attracted visitors from around the world.","expected":"International visitors flock to local festival."}',
          ].join('\n');
        }
        // For other files, simulate file not found
        const error = new Error('ENOENT: no such file or directory') as unknown;
        (error as { code?: string }).code = 'ENOENT';
        throw error;
      }),
    },
  };
});

/**
 * Exported mock config object - the control panel for all tests
 * Represents the ideal "happy path" state with all necessary API keys defined
 */
export const mockConfig = {
  server: {
    port: 3000,
    env: 'test',
    host: 'localhost',
  },
  database: {
    url: ':memory:',
    maxConnections: 5,
  },
  openai: {
    apiKey: 'sk-test-mock-openai-key',
    timeout: 30000,
    maxRetries: 3,
  },
  gemini: {
    apiKey: 'sk-test-mock-gemini-key',
    timeout: 30000,
    maxRetries: 3,
  },
  logging: {
    level: 'info' as const,
    enableFileLogging: false,
    maxFileSize: 10485760,
    maxFiles: 5,
  },
  rateLimit: {
    windowMs: 900000,
    globalMax: 10000, // Very high limit for tests
    jobsMax: 1000, // Very high limit for tests
  },
  evaluation: {
    timeout: 30000,
    concurrency: 5,
    maxCases: 1000,
  },
  security: {
    requestSizeLimit: '1mb',
    enableTrustProxy: false,
  },
};

/**
 * Exported mock evaluator function - controllable from any test
 */
export const mockEvaluateFunction = vi.fn().mockResolvedValue({
  id: 'test-case-1',
  prediction: 'mock completion',
  reference: 'expected output',
  latencyMs: 100,
  tokens: 5,
  score: 0.9,
});

/**
 * Exported health check mock functions - controllable from any test
 */
export const mockCheckOpenAI = vi.fn().mockResolvedValue('healthy');
export const mockCheckGemini = vi.fn().mockResolvedValue('healthy');
export const mockCheckDatabase = vi.fn().mockResolvedValue('healthy');

/**
 * Exported job store and mock functions - controllable from any test
 */
export const mockJobStore = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any
export const mockCreateJob = vi.fn();
export const mockGetJob = vi.fn();
export const mockUpdateJob = vi.fn();

// ================================================================================================
// GLOBAL MOCKS - Single Source of Truth
// ================================================================================================

// Mock better-sqlite3 to avoid native module compilation issues in CI
vi.mock('better-sqlite3', () => {
  const mockStatement = {
    run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
    get: vi.fn().mockReturnValue(null),
    all: vi.fn().mockReturnValue([]),
    bind: vi.fn().mockReturnThis(),
    finalize: vi.fn(),
    raw: vi.fn().mockReturnThis(), // Critical: adds the 'raw' method for Drizzle
    values: vi.fn().mockReturnValue([]),
  };

  const mockDb = {
    prepare: vi.fn(() => mockStatement),
    close: vi.fn(),
    exec: vi.fn(),
    transaction: vi.fn((fn) => fn),
  };

  return {
    default: vi.fn(() => mockDb),
  };
});

// Mock the job service at the package level
vi.mock('../../packages/api/src/jobs/service', () => {
  return {
    createJob: mockCreateJob,
    getJob: mockGetJob,
    updateJob: mockUpdateJob,
  };
});

// Mock the entire config module - single source of truth
vi.mock('../../packages/api/src/config/index', () => ({
  config: mockConfig,
}));

// Also mock the @prompt-lab/api package to ensure config is properly mocked
vi.mock('@prompt-lab/api', async (importOriginal) => {
  const originalModule = (await importOriginal()) as any;

  // Set up the job store and mock implementations
  let jobIdCounter = 1;

  mockCreateJob.mockImplementation(async (data) => {
    const id = `job-${jobIdCounter++}`;
    const newJob = {
      id,
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockJobStore.set(id, newJob);
    return newJob;
  });

  mockGetJob.mockImplementation(async (id: string) => {
    return mockJobStore.get(id) || null;
  });

  mockUpdateJob.mockImplementation(async (id, updateData) => {
    const job = mockJobStore.get(id);
    if (!job) {
      return null;
    }
    const updatedJob = {
      ...job,
      ...updateData,
      updatedAt: new Date(),
    };
    mockJobStore.set(id, updatedJob);
    return updatedJob;
  });

  // Mock provider functions
  const mockOpenAIProvider = {
    name: 'openai',
    models: ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
    complete: vi.fn().mockImplementation(async function* () {
      yield 'mocked ';
      yield 'openai ';
      yield 'response';
    }),
  };

  const mockGeminiProvider = {
    name: 'gemini',
    models: ['gemini-2.5-flash'],
    complete: vi.fn().mockImplementation(async function* () {
      yield 'mocked ';
      yield 'gemini ';
      yield 'response';
    }),
  };

  const mockGetProvider = vi.fn().mockImplementation((name: string) => {
    if (name === 'openai') return mockOpenAIProvider;
    if (name === 'gemini') return mockGeminiProvider;
    return undefined;
  });

  return {
    ...originalModule,
    config: mockConfig,
    createJob: mockCreateJob,
    getJob: mockGetJob,
    updateJob: mockUpdateJob,
    getProvider: mockGetProvider,
  };
});

// Mock evaluation providers - decouple from actual evaluation logic
vi.mock('../../packages/api/src/evaluation/providers', () => ({
  getEvaluator: vi.fn().mockReturnValue(mockEvaluateFunction),
  evaluateWithOpenAI: mockEvaluateFunction,
  evaluateWithGemini: mockEvaluateFunction,
}));

// Mock OpenAI SDK - prevent actual API calls
vi.mock('openai', () => {
  const mockStreamChunk = {
    choices: [{ delta: { content: 'mock chunk' } }],
  };

  const mockStream = {
    async *[Symbol.asyncIterator]() {
      yield mockStreamChunk;
      yield { choices: [{ delta: { content: ' from openai' } }] };
    },
  };

  const mockOpenAI = vi.fn().mockImplementation(() => ({
    models: {
      list: vi.fn().mockResolvedValue({ data: [] }),
    },
    chat: {
      completions: {
        create: vi.fn().mockImplementation((params) => {
          if (params.stream) {
            // Return streaming response
            return Promise.resolve(mockStream);
          } else {
            // Return non-streaming response for evaluation
            return Promise.resolve({
              choices: [{ message: { content: 'mock completion' } }],
              usage: { total_tokens: 5 },
            });
          }
        }),
      },
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: [1, 0] }],
      }),
    },
  }));
  return {
    default: mockOpenAI,
  };
});

// Mock Google Generative AI SDK
vi.mock('@google/generative-ai', () => {
  const mockResult = {
    stream: {
      async *[Symbol.asyncIterator]() {
        yield { text: () => 'mock chunk' };
        yield { text: () => ' from gemini' };
      },
    },
  };

  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({
          response: { text: () => 'mock gemini response' },
        }),
        generateContentStream: vi.fn().mockResolvedValue(mockResult),
      }),
    })),
  };
});

// Mock provider modules
vi.mock('../../packages/api/src/providers/index', () => {
  const mockOpenAIProvider = {
    name: 'openai',
    models: ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
    complete: vi.fn().mockImplementation(async function* () {
      yield 'mocked ';
      yield 'openai ';
      yield 'response';
    }),
  };

  const mockGeminiProvider = {
    name: 'gemini',
    models: ['gemini-2.5-flash'],
    complete: vi.fn().mockImplementation(async function* () {
      yield 'mocked ';
      yield 'gemini ';
      yield 'response';
    }),
  };

  return {
    getProvider: vi.fn().mockImplementation((name: string) => {
      if (name === 'openai') return mockOpenAIProvider;
      if (name === 'gemini') return mockGeminiProvider;
      return undefined;
    }),
  };
});

vi.mock('../../packages/api/src/providers/openai', () => ({
  OpenAIProvider: {
    name: 'openai',
    models: ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
    complete: vi.fn().mockImplementation(async function* () {
      yield 'mocked ';
      yield 'openai ';
      yield 'response';
    }),
  },
}));

vi.mock('../../packages/api/src/providers/gemini', () => ({
  GeminiProvider: {
    name: 'gemini',
    models: ['gemini-2.5-flash'],
    complete: vi.fn().mockImplementation(async function* () {
      yield 'mocked ';
      yield 'gemini ';
      yield 'response';
    }),
  },
}));

// ================================================================================================
// TEST ISOLATION - Enforce Clean State
// ================================================================================================

// Set up in-memory database for all tests
beforeAll(() => {
  process.env.DATABASE_URL = ':memory:';
  process.env.NODE_ENV = 'test';
});

/**
 * Global afterEach hook - maintains test isolation
 * Resets all mocks and restores default config state
 */
afterEach(() => {
  // Clear all mock histories and reset mock implementations
  vi.clearAllMocks();

  // Clear the job store for test isolation
  mockJobStore.clear();

  // Reset mockConfig to default "happy path" state
  mockConfig.openai.apiKey = 'sk-test-mock-openai-key';
  mockConfig.gemini.apiKey = 'sk-test-mock-gemini-key';
  mockConfig.server.env = 'test';

  // Reset health check mocks to healthy state
  mockCheckOpenAI.mockResolvedValue('healthy');
  mockCheckGemini.mockResolvedValue('healthy');
  mockCheckDatabase.mockResolvedValue('healthy');

  // Reset evaluator mock to success state
  mockEvaluateFunction.mockResolvedValue({
    id: 'test-case-1',
    prediction: 'mock completion',
    reference: 'expected output',
    latencyMs: 100,
    tokens: 5,
    score: 0.9,
  });

  // Re-setup job mocks after clearAllMocks
  let jobIdCounter = 1;

  mockCreateJob.mockImplementation(async (data) => {
    const id = `job-${jobIdCounter++}`;
    const newJob = {
      id,
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockJobStore.set(id, newJob);
    return newJob;
  });

  mockGetJob.mockImplementation(async (id: string) => {
    return mockJobStore.get(id) || null;
  });

  mockUpdateJob.mockImplementation(async (id, updateData) => {
    const job = mockJobStore.get(id);
    if (!job) {
      return null;
    }
    const updatedJob = {
      ...job,
      ...updateData,
      updatedAt: new Date(),
    };
    mockJobStore.set(id, updatedJob);
    return updatedJob;
  });
});
