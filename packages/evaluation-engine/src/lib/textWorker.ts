/**
 * Task 1 - Shared Text Utilities
 * Tokenisation + normalisation wrapper around wink-tokenizer
 */

import winkTokenizer from 'wink-tokenizer';

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
  tokenCount: number;
}

/**
 * Creates a new text worker instance with wink-tokenizer
 */
export function createTextWorker() {
  const tokenizer = winkTokenizer();

  /**
   * Tokenizes and normalizes text
   */
  function tokenize(text: string): Token[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    return tokenizer.tokenize(text.trim());
  }

  /**
   * Extracts words from tokens (filters out punctuation, spaces, etc.)
   */
  function extractWords(tokens: Token[]): string[] {
    return tokens
      .filter((token) => token.tag === 'word')
      .map((token) => token.value.toLowerCase());
  }

  /**
   * Extracts sentences from text
   */
  function extractSentences(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }

    return text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Normalizes text by converting to lowercase, removing extra whitespace
   */
  function normalize(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Comprehensive text analysis
   */
  function analyzeText(text: string): TextStats {
    const tokens = tokenize(text);
    const words = extractWords(tokens);
    const sentences = extractSentences(text);

    return {
      tokens,
      words,
      sentences,
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence:
        sentences.length > 0 ? words.length / sentences.length : 0,
      tokenCount: tokens.length,
    };
  }

  /**
   * Normalize text for better matching (handles plurals, accents, etc.)
   */
  function normalizeForMatching(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate keyword variations for better matching (plurals, tense variations)
   */
  function generateKeywordVariations(keyword: string): string[] {
    const normalized = normalizeForMatching(keyword);
    const variations = [normalized];

    // Add plural forms
    if (!normalized.endsWith('s')) {
      variations.push(normalized + 's');
    }
    if (normalized.endsWith('y') && normalized.length > 2) {
      variations.push(normalized.slice(0, -1) + 'ies');
    }

    // Add singular forms
    if (normalized.endsWith('s') && normalized.length > 2) {
      variations.push(normalized.slice(0, -1));
    }
    if (normalized.endsWith('ies') && normalized.length > 3) {
      variations.push(normalized.slice(0, -3) + 'y');
    }

    // Add common verb tense variations
    if (normalized.endsWith('ing') && normalized.length > 4) {
      let base = normalized.slice(0, -3);

      // Handle double consonants (running -> run, sitting -> sit)
      if (base.length >= 2) {
        const lastChar = base[base.length - 1];
        const secondLastChar = base[base.length - 2];
        if (
          lastChar === secondLastChar &&
          'bcdfghjklmnpqrstvwxyz'.includes(lastChar)
        ) {
          base = base.slice(0, -1); // Remove one of the double consonants
        }
      }

      variations.push(base, base + 'ed', base + 's');
    }
    if (normalized.endsWith('ed') && normalized.length > 3) {
      const base = normalized.slice(0, -2);
      variations.push(base, base + 'ing', base + 's');
    }

    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Find keyword matches in text with word boundary enforcement
   */
  function findKeywordMatchesWithBoundaries(
    text: string,
    keyword: string,
  ): string[] {
    const normalizedText = normalizeForMatching(text);
    const variations = generateKeywordVariations(keyword);
    const matches: string[] = [];

    // Extract words for exact matching
    const words = extractWords(tokenize(normalizedText));

    variations.forEach((variation) => {
      words.forEach((word) => {
        // Exact word match (not substring)
        if (word === variation) {
          matches.push(word);
        }
      });
    });

    return [...new Set(matches)]; // Remove duplicates
  }

  return {
    tokenize,
    extractWords,
    extractSentences,
    normalize,
    analyzeText,
    normalizeForMatching,
    generateKeywordVariations,
    findKeywordMatchesWithBoundaries,
  };
}

// Default instance for convenience
export const textWorker = createTextWorker();
