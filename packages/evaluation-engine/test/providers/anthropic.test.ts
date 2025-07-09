import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnthropicProvider } from '../../src/providers/anthropic.js';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
        countTokens: vi.fn(),
      },
    })),
  };
});

describe('AnthropicProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variable
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  });

  it('should have correct provider name and models', () => {
    expect(AnthropicProvider.name).toBe('anthropic');
    expect(AnthropicProvider.models).toContain('claude-3-5-haiku-20241022');
  });

  it('should implement the complete method', () => {
    expect(typeof AnthropicProvider.complete).toBe('function');
  });

  it('should implement the stream method', () => {
    expect(typeof AnthropicProvider.stream).toBe('function');
  });

  it('should throw error when API key is not configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    await expect(
      AnthropicProvider.complete('test prompt', {
        model: 'claude-3-5-haiku-20241022',
      }),
    ).rejects.toThrow('Anthropic API key not configured');
  });
});
