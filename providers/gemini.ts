export const name = 'gemini';
export const supports = ['gemini-2.5-flash'];
export async function* complete(prompt: string): AsyncGenerator<string> {
  yield `gemini:${prompt}`;
}
