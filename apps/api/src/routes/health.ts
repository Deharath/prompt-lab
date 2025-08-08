import { Router } from 'express';
import { config, log } from '@prompt-lab/evaluation-engine';
import { getDb } from '@prompt-lab/evaluation-engine';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: {
    database: 'healthy' | 'unhealthy';
    openai: 'healthy' | 'degraded' | 'unhealthy';
    gemini?: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
  };
}

async function checkDatabase(): Promise<'healthy' | 'unhealthy'> {
  try {
    const db = await getDb();

    // Try a simple query to ensure database is actually working
    // This will fail if migrations haven't run properly
    await db.run('SELECT 1');

    return 'healthy';
  } catch (error) {
    log.error('Database health check failed', {
      error: error instanceof Error ? error.message : String(error),
      nodeEnv: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL,
    });
    return 'unhealthy';
  }
}

async function checkOpenAI(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
  if (!config.openai.apiKey) {
    return 'degraded'; // Service configured but not available
  }

  // In test/CI environments with dummy API keys, skip actual API validation
  const isTestEnv = process.env.NODE_ENV === 'test';
  const isCIEnv =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const isDummyKey =
    config.openai.apiKey.includes('dummy') ||
    config.openai.apiKey.includes('test');

  if ((isTestEnv || isCIEnv) && isDummyKey) {
    return 'healthy'; // Assume healthy in test environments with dummy keys
  }

  try {
    const openai = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: 5000, // Short timeout for health checks
    });

    // Simple API call to check connectivity
    await openai.models.list();
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkGemini(): Promise<
  'healthy' | 'degraded' | 'unhealthy' | undefined
> {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) return undefined; // Not configured

  // In test/CI or with dummy keys, skip external calls
  const isTestEnv = process.env.NODE_ENV === 'test';
  const isCIEnv =
    process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const isDummyKey =
    String(apiKey).toLowerCase().includes('test') ||
    String(apiKey).toLowerCase().includes('dummy');
  if ((isTestEnv || isCIEnv) && isDummyKey) {
    return 'healthy';
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use countTokens for a minimal, non-billable connectivity check
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    // Prefer a minimal/non-billable check if available; otherwise do a tiny request
    const anyModel = model as any;
    if (typeof anyModel.countTokens === 'function') {
      await anyModel.countTokens({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      });
    } else {
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
      });
    }
    return 'healthy';
  } catch {
    // Invalid key or network error
    return 'unhealthy';
  }
}

router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const [database, openai, gemini] = await Promise.allSettled([
      checkDatabase(),
      checkOpenAI(),
      checkGemini(),
    ]);

    const dependencies = {
      database: database.status === 'fulfilled' ? database.value : 'unhealthy',
      openai: openai.status === 'fulfilled' ? openai.value : 'unhealthy',
      ...(gemini.status === 'fulfilled' &&
        gemini.value && { gemini: gemini.value }),
    };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (
      dependencies.database === 'unhealthy' ||
      dependencies.openai === 'unhealthy'
    ) {
      status = 'unhealthy';
    } else if (
      dependencies.openai === 'degraded' ||
      dependencies.gemini === 'degraded'
    ) {
      status = 'degraded';
    }

    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.0.0',
      dependencies,
      metrics: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };

    const duration = Date.now() - startTime;

    // Log health check results
    log.info('Health check completed', {
      status,
      duration,
      dependencies,
    });

    // Return appropriate HTTP status code
    const statusCode =
      status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(
      'Health check failed',
      { duration },
      error instanceof Error ? error : new Error(String(error)),
    );

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: process.uptime(),
    });
  }
});

// Readiness probe - simpler check for container orchestration
router.get('/ready', async (req, res) => {
  try {
    log.info('Health check /ready endpoint called');
    await getDb();
    log.info('Database connection successful for /ready');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    log.error('Database connection failed for /ready', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Liveness probe - basic process health
router.get('/live', (req, res) => {
  log.info('Health check /live endpoint called');
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Simple health check without database dependency for debugging
router.get('/ping', (req, res) => {
  log.info('Health check /ping endpoint called');
  res.status(200).json({ status: 'pong', timestamp: new Date().toISOString() });
});

export default router;
