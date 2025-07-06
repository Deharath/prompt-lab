/**
 * Task 4 - Keyword Metrics
 * Token-level match with optional per-keyword weight
 * Weighted P/R regression passes plural & accent cases
 */
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
  precision: number;
  recall: number;
  f_score: number;
  totalMatches: number;
  weightedScore: number;
  matches: KeywordMatch[];
}
/**
 * Calculate keyword metrics for a given text and keyword list
 */
export declare function calculateKeywordMetrics(
  text: string,
  keywords: string[] | KeywordWeight[],
): KeywordMetrics;
/**
 * Test function for regression testing with plurals and accents
 */
export declare function runKeywordRegressionTests(): boolean;
