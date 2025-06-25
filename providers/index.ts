export { name as openaiName, supports as openaiSupports, complete as openaiComplete } from './openai.js';
export { name as geminiName, supports as geminiSupports, complete as geminiComplete } from './gemini.js';
export function getProvider() {
  return null;
}
