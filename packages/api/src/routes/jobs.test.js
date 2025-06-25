"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const node_fs_1 = __importDefault(require("node:fs"));
const jobs_1 = __importDefault(require("./jobs"));
const db_1 = require("../db");
const JobService = __importStar(require("../jobs/service"));
// Mock the providers module to avoid real API calls and control test behavior
vitest_1.vi.mock('../providers', async (importOriginal) => {
    const original = await importOriginal();
    async function* mockCompleteSuccess() {
        yield 'Hel';
        yield 'lo';
        yield ' world';
    }
    async function* mockCompleteFailure() {
        yield 'This ';
        throw new Error('Provider failed spectacularly');
    }
    return {
        ...original,
        getProvider: (name) => {
            if (name === 'mock-success') {
                return { name: 'mock-success', models: ['default'], complete: mockCompleteSuccess };
            }
            if (name === 'mock-fail') {
                return { name: 'mock-fail', models: ['default'], complete: mockCompleteFailure };
            }
            return undefined;
        },
    };
});
const TEST_DB_FILE = 'test-e2e-sqlite.db';
(0, vitest_1.describe)('/jobs API endpoints', () => {
    let app;
    (0, vitest_1.beforeAll)(() => {
        // In a real project, you'd use a dedicated test DB setup.
        // For this example, we ensure the test DB file doesn't exist.
        if (node_fs_1.default.existsSync(TEST_DB_FILE)) {
            node_fs_1.default.unlinkSync(TEST_DB_FILE);
        }
        process.env.DATABASE_URL = TEST_DB_FILE;
        // Manually create table for tests since we don't run migrations here.
        db_1.db.run('CREATE TABLE jobs (id TEXT PRIMARY KEY, prompt TEXT NOT NULL, provider TEXT NOT NULL, model TEXT NOT NULL, status TEXT NOT NULL, result TEXT, metrics TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)');
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/jobs', jobs_1.default);
    });
    (0, vitest_1.afterAll)(() => {
        if (node_fs_1.default.existsSync(TEST_DB_FILE)) {
            node_fs_1.default.unlinkSync(TEST_DB_FILE);
        }
    });
    (0, vitest_1.it)('POST /jobs should create a job and return 202', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/jobs')
            .send({ prompt: 'test prompt', provider: 'mock-success', model: 'default' });
        (0, vitest_1.expect)(response.status).toBe(202);
        (0, vitest_1.expect)(response.body).toHaveProperty('id');
        (0, vitest_1.expect)(response.body.status).toBe('pending');
    });
    (0, vitest_1.it)('GET /jobs/:id/stream should stream tokens and a final metrics event for a successful job', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/jobs')
            .send({ prompt: 'a successful run', provider: 'mock-success', model: 'default' });
        const { id } = createRes.body;
        const streamRes = await (0, supertest_1.default)(app).get(`/jobs/${id}/stream`);
        (0, vitest_1.expect)(streamRes.status).toBe(200);
        (0, vitest_1.expect)(streamRes.headers['content-type']).toBe('text/event-stream');
        const events = streamRes.text.split('\n\n').filter(Boolean);
        (0, vitest_1.expect)(events).toHaveLength(4); // 3 tokens + 1 metrics
        (0, vitest_1.expect)(events[0]).toBe('data: {"token":"Hel"}');
        (0, vitest_1.expect)(events[1]).toBe('data: {"token":"lo"}');
        (0, vitest_1.expect)(events[2]).toBe('data: {"token":" world"}');
        (0, vitest_1.expect)(events[3]).toMatch(/^event: metrics\ndata: {"durationMs":\d+,"tokenCount":2}}$/);
        const job = await JobService.getJob(id);
        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('completed');
        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.result).toBe('Hello world');
    });
    (0, vitest_1.it)('GET /jobs/:id/stream should stream an error event for a failed job', async () => {
        const createRes = await (0, supertest_1.default)(app)
            .post('/jobs')
            .send({ prompt: 'a failing run', provider: 'mock-fail', model: 'default' });
        const { id } = createRes.body;
        const streamRes = await (0, supertest_1.default)(app).get(`/jobs/${id}/stream`);
        const events = streamRes.text.split('\n\n').filter(Boolean);
        (0, vitest_1.expect)(events).toHaveLength(2); // 1 token + 1 error
        (0, vitest_1.expect)(events[0]).toBe('data: {"token":"This "}');
        (0, vitest_1.expect)(events[1]).toBe('event: error\ndata: {"error":"Provider failed spectacularly"}');
        const job = await JobService.getJob(id);
        (0, vitest_1.expect)(job === null || job === void 0 ? void 0 : job.status).toBe('failed');
    });
});
