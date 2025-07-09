import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ProviderOptions } from './index.js';
import { PRICING } from './pricing.js';

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Anthropic({ apiKey });
}

async function complete(
  prompt: string,
  options: ProviderOptions,
): Promise<{ output: string; tokens: number; cost: number }> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    throw new Error(
      'Anthropic API key not configured. Cannot process request.',
    );
  }

  const message = await anthropic.messages.create({
    model: options.model,
    max_tokens: options.maxTokens ?? 4096,
    messages: [{ role: 'user', content: prompt }],
    ...(options.temperature !== undefined && {
      temperature: options.temperature,
    }),
    ...(options.topP !== undefined && { top_p: options.topP }),
  });

  const output = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('');

  // Get token count using Anthropic's token counting API
  let tokens = 0;
  try {
    const tokenResponse = await anthropic.messages.countTokens({
      model: options.model,
      messages: [{ role: 'user', content: prompt }],
    });
    tokens = tokenResponse.input_tokens + (message.usage?.output_tokens ?? 0);
  } catch (error) {
    // Fallback to usage from response if token counting fails
    tokens =
      (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0);
  }

  const pricePerK =
    PRICING.anthropic[options.model as keyof typeof PRICING.anthropic] ?? 0;
  const cost = (tokens / 1000) * pricePerK;

  return { output, tokens, cost };
}

async function* stream(
  prompt: string,
  options: ProviderOptions,
): AsyncGenerator<{ content: string; isFinal?: boolean }, void, unknown> {
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    throw new Error(
      'Anthropic API key not configured. Cannot process request.',
    );
  }

  const stream = await anthropic.messages.create({
    model: options.model,
    max_tokens: options.maxTokens ?? 4096,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
    ...(options.temperature !== undefined && {
      temperature: options.temperature,
    }),
    ...(options.topP !== undefined && { top_p: options.topP }),
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield { content: chunk.delta.text };
    }

    if (chunk.type === 'message_stop') {
      yield { content: '', isFinal: true };
    }
  }
}

export const AnthropicProvider: LLMProvider = {
  name: 'anthropic',
  models: ['claude-3-5-haiku-20241022'],
  complete,
  stream,
};
