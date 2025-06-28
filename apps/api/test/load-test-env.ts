// ================================================================================================
// CRITICAL TEST ENVIRONMENT PRELOADER
// ================================================================================================
// This file MUST be loaded before any application code to ensure proper test isolation.
// It sets NODE_ENV to 'test' before any dotenv configuration can interfere.

process.env.NODE_ENV = 'test';

// Additional test environment isolation
process.env.DATABASE_URL = ':memory:';

// Prevent any external environment pollution
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';

console.log('✅ Test environment preloaded - NODE_ENV=' + process.env.NODE_ENV);
