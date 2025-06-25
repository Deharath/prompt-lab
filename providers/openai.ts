export const name = 'openai';
export const supports = ['gpt-4.1'];
export async function* complete(prompt: string): AsyncGenerator<string> {
  yield `openai:${prompt}`;
}
