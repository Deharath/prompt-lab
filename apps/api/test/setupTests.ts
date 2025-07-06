import { vi, beforeAll, afterEach } from 'vitest';

// Set up in-memory database and environment variables for all tests FIRST
process.env.DATABASE_URL = ':memory:';
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';

// Ensure DB migrations are run before any tests
beforeAll(async () => {
  // Dynamically resolve the absolute path to the migrations file for ESM/monorepo
  const { fileURLToPath, pathToFileURL } = await import('url');
  const { join, dirname, resolve } = await import('path');
  const { existsSync, unlinkSync } = await import('fs');
  const testDir = dirname(fileURLToPath(import.meta.url));
  // Determine the test DB file path (matches config/database)
  const monorepoRoot = resolve(testDir, '../../../');
  const dbFile = resolve(monorepoRoot, 'packages/db/db.sqlite');
  // Only delete if DATABASE_URL points to this file (avoid deleting real DBs)
  if (
    process.env.DATABASE_URL === 'packages/db/db.sqlite' ||
    process.env.DATABASE_URL === './packages/db/db.sqlite' ||
    process.env.DATABASE_URL === dbFile
  ) {
    if (existsSync(dbFile)) {
      unlinkSync(dbFile);
      // Optionally log
      // console.log('🗑️ Deleted test DB file:', dbFile);
    }
  }
  const migrationsPath = join(
    testDir,
    '../../../packages/api/src/db/migrations.ts',
  );
  const migrationsUrl = pathToFileURL(migrationsPath).href;
  const { runMigrations } = await import(migrationsUrl);
  await runMigrations();
  // Optionally log success
  // console.log('✅ DB migrations completed for test environment');
});
import type { LLMProvider } from '@prompt-lab/evaluation-engine';

// =================================================================  mockGetPreviousJob.mockImplementation(getPreviousJobImpl);usJob.mockImplementation(getPreviousJobImpl);================
// CRITICAL CI FIX: PACKAGE-LEVEL MOCKING STRATEGY
// ================================================================================================

// --- MOCK CONTROLS FOR TEST MANIPULATION ---
export const mockEvaluateWithOpenAI = vi.fn();
export const mockEvaluateWithGemini = vi.fn();
export const mockGetProvider = vi.fn();
export const mockGetEvaluator = vi.fn();
export const mockCreateJob = vi.fn();
export const mockGetJob = vi.fn();
export const mockUpdateJob = vi.fn();
export const mockJobStore = new Map<string, any>();
export const mockListJobs = vi.fn();
export const mockGetPreviousJob = vi.fn();
export const mockSetProvider = vi.fn();
export const mockResetProviders = vi.fn();

// Mock provider registry for tests
export const mockProviderRegistry = new Map<string, any>();

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
    apiKey: 'sk-test-key-from-ci-fix',
    timeout: 30000,
    maxRetries: 3,
  },
  gemini: {
    apiKey: 'gemini-test-key-from-ci-fix',
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

// --- MOCK THE ENTIRE @prompt-lab/evaluation-engine PACKAGE ---
// This is the single most important change. We are intercepting the package
// that the application code actually imports.
vi.mock('@prompt-lab/evaluation-engine', async (importOriginal) => {
  const originalModule =
    await importOriginal<typeof import('@prompt-lab/evaluation-engine')>();

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

  mockListJobs.mockImplementation(async (opts = {}) => {
    const { limit = 20, offset = 0 } = opts as Record<string, number>;
    let items = Array.from(mockJobStore.values());
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(offset, offset + limit).map((j) => ({
      id: j.id,
      createdAt: j.createdAt,
      provider: j.provider,
      model: j.model,
      costUsd: j.costUsd ?? null,
      avgScore: j.metrics?.avgScore ?? null,
    }));
  });

  // Helper function to find the previous job
  const getPreviousJobImpl = async (currentJobId: string) => {
    // Get all jobs from the mock store and sort them by creation time (oldest first)
    const allJobs = Array.from(mockJobStore.values());
    allJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Find the current job index
    const currentJobIndex = allJobs.findIndex((job) => job.id === currentJobId);
    if (currentJobIndex === -1) {
      return undefined;
    }

    // Return the previous job (the one created immediately before the current job)
    // If the current job is at index 0, there's no previous job
    return currentJobIndex > 0 ? allJobs[currentJobIndex - 1] : undefined;
  };

  mockGetPreviousJob.mockImplementation(async (currentJobId: string) => {
    return getPreviousJobImpl(currentJobId);
  });

  // Return a new module object that mocks specific exports
  return {
    ...originalModule, // Keep any original exports we don't need to touch

    // Override the functions that cause failures
    getProvider: mockGetProvider.mockImplementation((providerName) => {
      // First check if there's a custom provider set via setProvider
      if (mockProviderRegistry.has(providerName)) {
        return mockProviderRegistry.get(providerName);
      }

      // Return undefined for unknown providers to match real behavior
      if (providerName !== 'openai' && providerName !== 'gemini') {
        return undefined;
      }

      // Return a mock provider with a mock streaming function
      return {
        name: providerName,
        models:
          providerName === 'openai'
            ? ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini']
            : ['gemini-2.5-flash'],
        complete: async () => ({
          output: 'mock stream chunk',
          tokens: 3,
          cost: 0.00001,
        }),
        async *stream() {
          yield { content: 'mock chunk' };
          yield { content: ' from ' + providerName };
        },
      };
    }),

    setProvider: mockSetProvider.mockImplementation(
      (name: string, provider: LLMProvider) => {
        mockProviderRegistry.set(name, provider);
      },
    ),

    resetProviders: mockResetProviders.mockImplementation(() => {
      mockProviderRegistry.clear();
    }),

    evaluateWithOpenAI: mockEvaluateWithOpenAI.mockResolvedValue({
      id: 'test-case-1',
      prediction: 'mock completion',
      reference: 'expected output',
      latencyMs: 100,
      tokens: 5,
      score: 0.9,
    }),

    evaluateWithGemini: mockEvaluateWithGemini.mockResolvedValue({
      id: 'test-case-1',
      prediction: 'mock gemini completion',
      reference: 'expected output',
      latencyMs: 120,
      tokens: 7,
      score: 0.85,
    }),

    getEvaluator: mockGetEvaluator.mockImplementation((model: string) => {
      if (model.startsWith('gpt-')) {
        return mockEvaluateWithOpenAI;
      }
      if (model === 'gemini-2.5-flash' || model.startsWith('gemini-')) {
        return mockEvaluateWithGemini;
      }
      throw new Error(`Unsupported model: ${model}`);
    }),

    // Mock job service functions
    createJob: mockCreateJob,
    getJob: mockGetJob,
    updateJob: mockUpdateJob,
    listJobs: mockListJobs,
    getPreviousJob: mockGetPreviousJob,

    // Mock config
    config: mockConfig,
  };
});

// --- MOCK FILESYSTEM OPERATIONS FOR DATASETS ---
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
      ...((actual as typeof import('fs')).promises || {}),
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

// --- MOCK DATABASE AND OTHER LIBS (These are usually correct) ---
// Mock better-sqlite3 to avoid native module compilation issues in CI
vi.mock('better-sqlite3', () => {
  // Simulate a jobs table with all expected columns
  let jobsTable: unknown[] = [];

  const mockStatement = {
    run: vi.fn((params) => {
      // Simulate INSERT INTO jobs
      if (params && typeof params === 'object') {
        jobsTable.push({
          id: params.id || `job-${jobsTable.length + 1}`,
          prompt: params.prompt || '',
          provider: params.provider || '',
          model: params.model || '',
          status: params.status || 'pending',
          result: params.result || null,
          metrics: params.metrics || null,
          error_message: params.error_message || null,
          tokens_used: params.tokens_used || null,
          cost_usd: params.cost_usd || null,
          temperature: params.temperature || null,
          top_p: params.top_p || null,
          max_tokens: params.max_tokens || null,
          selected_metrics: params.selected_metrics || null,
          created_at: params.created_at || Date.now(),
          updated_at: params.updated_at || Date.now(),
        });
      }
      return { changes: 1, lastInsertRowid: jobsTable.length };
    }),
    get: vi.fn(() => {
      // Simulate SELECT * FROM jobs WHERE ...
      if (jobsTable.length > 0) {
        return jobsTable[0];
      }
      return null;
    }),
    all: vi.fn(() => jobsTable),
    bind: vi.fn().mockReturnThis(),
    finalize: vi.fn(),
    raw: vi.fn().mockReturnThis(), // Critical: adds the 'raw' method for Drizzle
    values: vi.fn().mockReturnValue([]),
  };

  const mockDb = {
    prepare: vi.fn(() => mockStatement),
    close: vi.fn(),
    exec: vi.fn((sql: string) => {
      // Simulate CREATE TABLE IF NOT EXISTS jobs ...
      if (sql && sql.includes('CREATE TABLE IF NOT EXISTS jobs')) {
        // No-op, just acknowledge table creation
      }
    }),
    transaction: vi.fn((fn) => fn),
  };

  return {
    default: vi.fn(() => mockDb),
  };
});

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

// ================================================================================================
// TEST ISOLATION - Enforce Clean State
// ================================================================================================

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
  mockConfig.openai.apiKey = 'sk-test-key-from-ci-fix';
  mockConfig.gemini.apiKey = 'gemini-test-key-from-ci-fix';
  mockConfig.server.env = 'test';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';

  // Reset evaluator mocks to success state
  mockEvaluateWithOpenAI.mockResolvedValue({
    id: 'test-case-1',
    prediction: 'mock completion',
    reference: 'expected output',
    latencyMs: 100,
    tokens: 5,
    score: 0.9,
  });

  mockEvaluateWithGemini.mockResolvedValue({
    id: 'test-case-1',
    prediction: 'mock gemini completion',
    reference: 'expected output',
    latencyMs: 120,
    tokens: 7,
    score: 0.85,
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
  mockListJobs.mockImplementation(async (opts = {}) => {
    const { limit = 20, offset = 0 } = opts as Record<string, number>;
    let items = Array.from(mockJobStore.values());
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return items.slice(offset, offset + limit).map((j) => ({
      id: j.id,
      createdAt: j.createdAt,
      provider: j.provider,
      model: j.model,
      costUsd: j.costUsd ?? null,
      avgScore: j.metrics?.avgScore ?? null,
    }));
  });

  // Helper function to find the previous job
  const getPreviousJobImpl = async (currentJobId: string) => {
    // Get all jobs from the mock store and sort them by creation time (oldest first)
    const allJobs = Array.from(mockJobStore.values());
    allJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Find the current job index
    const currentJobIndex = allJobs.findIndex((job) => job.id === currentJobId);
    if (currentJobIndex === -1) {
      return undefined;
    }

    // Return the previous job (the one created immediately before the current job)
    // If the current job is at index 0, there's no previous job
    return currentJobIndex > 0 ? allJobs[currentJobIndex - 1] : undefined;
  };

  mockGetPreviousJob.mockImplementation(async (currentJobId: string) => {
    return getPreviousJobImpl(currentJobId);
  });

  // Reset provider mock
  mockGetProvider.mockImplementation((providerName) => {
    // Return undefined for unknown providers to match real behavior
    if (providerName !== 'openai' && providerName !== 'gemini') {
      return undefined;
    }

    return {
      name: providerName,
      models:
        providerName === 'openai'
          ? ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini']
          : ['gemini-2.5-flash'],
      complete: async function* () {
        yield 'mock ';
        yield 'stream ';
        yield 'chunk';
        // Properly terminate the generator
        return;
      },
    };
  });

  mockGetEvaluator.mockImplementation((model: string) => {
    if (model.startsWith('gpt-')) {
      return mockEvaluateWithOpenAI;
    }
    if (model === 'gemini-2.5-flash' || model.startsWith('gemini-')) {
      return mockEvaluateWithGemini;
    }
    throw new Error(`Unsupported model: ${model}`);
  });
});
