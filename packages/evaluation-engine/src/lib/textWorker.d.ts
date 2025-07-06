/**
 * Task 1 - Shared Text Utilities
 * Tokenisation + normalisation wrapper around wink-tokenizer
 */
export interface Token {
  value: string;
  tag: string;
  normal?: string;
}
export interface TextStats {
  tokens: Token[];
  words: string[];
  sentences: string[];
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
}
/**
 * Creates a new text worker instance with wink-tokenizer
 */
export declare function createTextWorker(): {
  tokenize: (text: string) => Token[];
  extractWords: (tokens: Token[]) => string[];
  extractSentences: (text: string) => string[];
  normalize: (text: string) => string;
  analyzeText: (text: string) => TextStats;
  normalizeForMatching: (text: string) => string;
  generateKeywordVariations: (keyword: string) => string[];
  findKeywordMatchesWithBoundaries: (text: string, keyword: string) => string[];
};
export declare const textWorker: {
  tokenize: (text: string) => Token[];
  extractWords: (tokens: Token[]) => string[];
  extractSentences: (text: string) => string[];
  normalize: (text: string) => string;
  analyzeText: (text: string) => TextStats;
  normalizeForMatching: (text: string) => string;
  generateKeywordVariations: (keyword: string) => string[];
  findKeywordMatchesWithBoundaries: (text: string, keyword: string) => string[];
};
