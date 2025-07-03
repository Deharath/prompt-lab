/**
 * A collection of utility functions for evaluating prompts and responses.
 * Each function is designed to calculate a specific metric that provides
 * insight into the quality, complexity, or characteristics of text.
 */

/**
 * Calculates the Flesch Reading Ease score for a given text.
 * Higher scores indicate material that is easier to read; lower numbers mark passages
 * that are more difficult to read.
 *
 * 90-100: Very easy to read. Easily understood by an average 11-year-old student.
 * 80-89: Easy to read. Conversational English for consumers.
 * 70-79: Fairly easy to read.
 * 60-69: Plain English. Easily understood by 13- to 15-year-old students.
 * 50-59: Fairly difficult to read.
 * 30-49: Difficult to read.
 * 0-29: Very difficult to read. Best understood by university graduates.
 *
 * @param text - The text to analyze
 * @returns A score between 0 and 100
 */
export function calculateFleschReadingEase(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Count sentences by splitting on periods, exclamation points, and question marks
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  if (sentenceCount === 0) {
    return 0;
  }

  // Count words by splitting on whitespace
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  const wordCount = words.length;

  if (wordCount === 0) {
    return 0;
  }

  // Count syllables
  let syllableCount = 0;
  words.forEach((word) => {
    syllableCount += countSyllables(word);
  });

  // Calculate Flesch Reading Ease score
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;

  // The Flesch Reading Ease formula
  const score =
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  // Ensure score is between 0 and 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Helper function to count syllables in a word
 * This is a simplified approach that may not be 100% accurate but works for most common words
 */
function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) {
    return 1;
  }

  // Remove common suffixes that don't add syllables
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Count vowel groups
  const syllables = word.match(/[aeiouy]{1,2}/g);

  return syllables ? syllables.length : 1;
}

/**
 * Performs sentiment analysis on the given text.
 * Returns a score between -1 (very negative) and 1 (very positive).
 *
 * @param text - The text to analyze
 * @returns A number between -1 (negative) and 1 (positive)
 */
export function calculateSentiment(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0; // Neutral for empty text
  }

  // A simple lexicon-based sentiment analysis implementation
  const positiveWords = [
    'good',
    'great',
    'excellent',
    'positive',
    'wonderful',
    'fantastic',
    'amazing',
    'love',
    'happy',
    'joy',
    'success',
    'best',
    'better',
    'improve',
    'beneficial',
    'perfect',
    'awesome',
    'outstanding',
    'brilliant',
    'thank',
    'appreciated',
    'pleased',
    'impressive',
  ];

  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'negative',
    'horrible',
    'poor',
    'worst',
    'failure',
    'hate',
    'sad',
    'unhappy',
    'disappointed',
    'disaster',
    'problem',
    'difficult',
    'wrong',
    'trouble',
    'fail',
    'worrying',
    'unfortunate',
    'harmful',
    'tragic',
    'annoying',
    'frustrating',
    'inadequate',
  ];

  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];

  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.includes(word)) {
      positiveCount++;
    } else if (negativeWords.includes(word)) {
      negativeCount++;
    }
  });

  // Basic negation handling (e.g., "not good" is negative)
  const negations = (
    text
      .toLowerCase()
      .match(/\b(?:not|no|never|neither|barely|hardly|scarcely)\b/g) || []
  ).length;

  // Adjust for negations (simple approach - flip some positives to negatives)
  if (negations > 0) {
    const flipCount = Math.min(negations, positiveCount);
    positiveCount -= flipCount;
    negativeCount += flipCount;
  }

  if (positiveCount === 0 && negativeCount === 0) {
    return 0; // Neutral if no sentiment words are found
  }

  // Calculate sentiment score on a scale from -1 to 1
  return (positiveCount - negativeCount) / (positiveCount + negativeCount);
}

/**
 * Checks if a string is valid JSON and properly formatted.
 *
 * @param text - The text to check
 * @returns An object containing a boolean indicating if the text is valid JSON and any error message
 */
export function checkJsonValidity(text: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (!text || text.trim().length === 0) {
    return { isValid: false, errorMessage: 'Empty input' };
  }

  try {
    const parsed = JSON.parse(text);

    // Check if it's a proper object or array and not just a primitive
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        isValid: false,
        errorMessage: 'Valid JSON but not an object or array',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Counts the number of words in a text.
 *
 * @param text - The text to count words in
 * @returns The number of words
 */
export function countWords(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Split by whitespace and filter out empty strings
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  return words.length;
}

/**
 * Checks if the text contains specific keywords.
 *
 * @param text - The text to check
 * @param keywords - Array of keywords to look for
 * @returns An object containing metrics about found keywords
 */
export function checkForKeywords(
  text: string,
  keywords: string[],
): {
  found: string[];
  missing: string[];
  foundCount: number;
  missingCount: number;
  matchPercentage: number;
} {
  if (!text || !keywords || keywords.length === 0) {
    return {
      found: [],
      missing: [],
      foundCount: 0,
      missingCount: 0,
      matchPercentage: 0,
    };
  }

  const textLower = text.toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  keywords.forEach((keyword) => {
    const trimmedKeyword = keyword.trim().toLowerCase();
    if (trimmedKeyword && textLower.includes(trimmedKeyword)) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  const foundCount = found.length;
  const missingCount = missing.length;
  const totalCount = keywords.length;
  const matchPercentage = totalCount > 0 ? (foundCount / totalCount) * 100 : 0;

  return {
    found,
    missing,
    foundCount,
    missingCount,
    matchPercentage,
  };
}
