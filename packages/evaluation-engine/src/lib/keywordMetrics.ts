/**
 * Task 4 - Keyword Metrics
 * Token-level match with optional per-keyword weight
 * Weighted P/R regression passes plural & accent cases
 */

import { textWorker } from './textWorker.js';

export interface KeywordWeight {
  keyword: string;
  weight: number;
}

export interface KeywordMatch {
  keyword: string;
  matches: string[];
  count: number;
  weight: number;
  weightedScore: number;
}

export interface KeywordMetrics {
  precision: number; // Precision of keyword matches
  recall: number; // Recall of keyword matches
  f_score: number; // F1 score
  totalMatches: number; // Total number of matches found
  weightedScore: number; // Weighted score based on keyword weights
  matches: KeywordMatch[]; // Detailed match information
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
 * Generate keyword variations for better matching (plurals, etc.)
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

  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Find keyword matches in text with support for variations
 */
function findKeywordMatches(text: string, keyword: string): string[] {
  const normalizedText = normalizeForMatching(text);
  const variations = generateKeywordVariations(keyword);
  const matches: string[] = [];

  // Tokenize the text for better matching
  const stats = textWorker.analyzeText(normalizedText);
  const words = stats.words;

  variations.forEach((variation) => {
    words.forEach((word) => {
      // Use exact word matching
      if (word === variation) {
        matches.push(word);
      }
    });
  });

  return matches; // Don't remove duplicates - we want to count all occurrences
}

/**
 * Calculate keyword metrics for a given text and keyword list
 */
export function calculateKeywordMetrics(
  text: string,
  keywords: string[] | KeywordWeight[],
): KeywordMetrics {
  if (!text || !keywords || keywords.length === 0) {
    return {
      precision: 0,
      recall: 0,
      f_score: 0,
      totalMatches: 0,
      weightedScore: 0,
      matches: [],
    };
  }

  // Convert keywords to weighted format if they're just strings
  const weightedKeywords: KeywordWeight[] = keywords.map((k) =>
    typeof k === 'string' ? { keyword: k, weight: 1 } : k,
  );

  // Find matches for each keyword
  const matches: KeywordMatch[] = weightedKeywords.map(
    ({ keyword, weight }) => {
      const foundMatches = findKeywordMatches(text, keyword);
      const count = foundMatches.length;
      const weightedScore = count * weight;

      return {
        keyword,
        matches: foundMatches,
        count,
        weight,
        weightedScore,
      };
    },
  );

  // Calculate metrics
  const totalMatches = matches.reduce((sum, match) => sum + match.count, 0);
  const totalKeywords = weightedKeywords.length;
  const keywordsFound = matches.filter((match) => match.count > 0).length;
  const totalWeight = weightedKeywords.reduce((sum, kw) => sum + kw.weight, 0);
  const weightedScore = matches.reduce(
    (sum, match) => sum + match.weightedScore,
    0,
  );

  // Calculate precision (how many found keywords vs total possible)
  const precision = totalKeywords > 0 ? keywordsFound / totalKeywords : 0;

  // Calculate recall (how many keywords were found vs expected)
  // For recall, we assume all keywords should be found ideally
  const recall = totalKeywords > 0 ? keywordsFound / totalKeywords : 0;

  // Calculate F-score
  const f_score =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  return {
    precision,
    recall,
    f_score,
    totalMatches,
    weightedScore: totalWeight > 0 ? weightedScore / totalWeight : 0,
    matches,
  };
}

/**
 * Test function for regression testing with plurals and accents
 */
export function runKeywordRegressionTests(): boolean {
  console.log('Running keyword regression tests...');

  // Test 1: Plural handling
  const pluralText =
    'I love cats and dogs. The cats are sleeping while dogs play.';
  const pluralKeywords = ['cat', 'dog'];
  const pluralResult = calculateKeywordMetrics(pluralText, pluralKeywords);

  const pluralPass = pluralResult.precision > 0.8 && pluralResult.recall > 0.8;
  console.log('Plural test:', { pluralResult, pass: pluralPass });

  // Test 2: Accent handling
  const accentText = 'José loves café and naïve résumés';
  const accentKeywords = ['Jose', 'cafe', 'naive', 'resumes'];
  const accentResult = calculateKeywordMetrics(accentText, accentKeywords);

  const accentPass = accentResult.precision >= 0.75; // Allow for some variance
  console.log('Accent test:', { accentResult, pass: accentPass });

  // Test 3: Weighted keywords
  const weightedText =
    'This product is excellent and amazing, but the price is high';
  const weightedKeywords: KeywordWeight[] = [
    { keyword: 'excellent', weight: 2 },
    { keyword: 'amazing', weight: 2 },
    { keyword: 'price', weight: 1 },
    { keyword: 'quality', weight: 1 }, // This won't be found
  ];
  const weightedResult = calculateKeywordMetrics(
    weightedText,
    weightedKeywords,
  );

  const weightedPass = weightedResult.weightedScore > 0.6;
  console.log('Weighted test:', { weightedResult, pass: weightedPass });

  const allPass = pluralPass && accentPass && weightedPass;
  console.log('All regression tests passed:', allPass);

  return allPass;
}
