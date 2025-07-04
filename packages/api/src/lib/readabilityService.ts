/**
 * Task 2 - Readability Service
 * Expose FRE, FK, SMOG via text-readability-ts
 * Reject input > 20 kB with 413
 */

import { Request, Response, NextFunction } from 'express';

const readability: any = require('text-readability-ts');

export interface ReadabilityScores {
  fleschReadingEase: number;
  fleschKincaid: number;
  smog: number;
  textLength: number;
}

export interface ReadabilityError {
  error: string;
  code: number;
}

/**
 * Middleware to check text size limit (20 kB)
 */
export function validateTextSize(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const text = req.body.text || '';
  const sizeInBytes = Buffer.byteLength(text, 'utf8');
  const maxSize = 20 * 1024; // 20 kB

  if (sizeInBytes > maxSize) {
    return res.status(413).json({
      error: `Text too large. Maximum size is ${maxSize} bytes, received ${sizeInBytes} bytes.`,
      code: 413,
    });
  }

  next();
}

/**
 * Calculate readability scores using text-readability-ts library
 */
export async function calculateReadabilityScores(
  text: string,
): Promise<ReadabilityScores> {
  if (!text || text.trim().length === 0) {
    return {
      fleschReadingEase: 0,
      fleschKincaid: 0,
      smog: 0,
      textLength: 0,
    };
  }

  try {
    const cleanText = preprocessTextForReadability(text);

    // Ensure we still have meaningful text after cleaning
    if (cleanText.trim().length === 0) {
      return {
        fleschReadingEase: 0,
        fleschKincaid: 0,
        smog: 0,
        textLength: text.length,
      };
    }

    return {
      fleschReadingEase: Math.max(
        0,
        Math.min(100, readability.fleschReadingEase(cleanText)),
      ),
      fleschKincaid: Math.max(0, readability.fleschKincaidGrade(cleanText)),
      smog: Math.max(0, readability.smogIndex(cleanText)),
      textLength: text.length, // Keep original text length for reference
    };
  } catch (error) {
    console.error('Error calculating readability scores:', error);
    // Fallback to manual calculation
    return calculateReadabilityScoresFallback(text);
  }
}

/**
 * Fallback manual calculation if library fails
 */
function calculateReadabilityScoresFallback(text: string): ReadabilityScores {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);

  if (sentences.length === 0 || words.length === 0) {
    return {
      fleschReadingEase: 0,
      fleschKincaid: 0,
      smog: 0,
      textLength: text.length,
    };
  }

  const avgSentenceLength = words.length / sentences.length;
  let totalSyllables = 0;
  let polysyllables = 0;

  words.forEach((word) => {
    const syllables = countSyllables(word);
    totalSyllables += syllables;
    if (syllables >= 3) {
      polysyllables++;
    }
  });

  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch Reading Ease: 206.835 - (1.015 × ASL) - (84.6 × ASW)
  const fleschReadingEase = Math.max(
    0,
    Math.min(
      100,
      206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord,
    ),
  );

  // Flesch-Kincaid Grade: (0.39 × ASL) + (11.8 × ASW) - 15.59
  const fleschKincaid = Math.max(
    0,
    0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59,
  );

  // SMOG Grade: 1.0430 × √(polysyllables × 30/sentences) + 3.1291
  const smog = Math.max(
    0,
    1.043 * Math.sqrt((polysyllables * 30) / sentences.length) + 3.1291,
  );

  return {
    fleschReadingEase,
    fleschKincaid,
    smog,
    textLength: text.length,
  };
}

/**
 * Count syllables in a word (simple heuristic)
 */
function countSyllables(word: string): number {
  if (!word || word.length === 0) return 0;

  word = word.toLowerCase();

  // Remove punctuation
  word = word.replace(/[^\w]/g, '');

  if (word.length <= 3) return 1;

  // Count vowel groups
  const vowels = 'aeiouy';
  let syllables = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    previousWasVowel = isVowel;
  }

  // Silent 'e' at end
  if (word.endsWith('e')) {
    syllables--;
  }

  // Every word has at least 1 syllable
  return Math.max(1, syllables);
}

/**
 * Preprocess text to remove markdown and formatting that interferes with readability analysis
 */
function preprocessTextForReadability(text: string): string {
  return (
    text
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove list markers
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Clean up multiple whitespace/newlines
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

/**
 * Express route handler for readability analysis
 */
export async function readabilityHandler(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text field is required and must be a string',
        code: 400,
      });
    }

    const scores = await calculateReadabilityScores(text);

    res.json({
      success: true,
      data: scores,
    });
  } catch (error) {
    console.error('Readability analysis error:', error);
    res.status(500).json({
      error: 'Internal server error during readability analysis',
      code: 500,
    });
  }
}
