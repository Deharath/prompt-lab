/**
 * Server-side sentiment analysis engine using Hugging Face transformers
 * This module contains the heavy ML dependencies and should only run server-side
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface SentimentScore {
  compound: number; // Overall sentiment score -1 to 1
  positive: number; // Positive sentiment 0 to 1
  negative: number; // Negative sentiment 0 to 1
  neutral: number; // Neutral sentiment 0 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number; // Confidence in the prediction 0 to 1
  mode: 'accurate'; // Mode of analysis
  disabled?: boolean;
  disabledReason?: string;
}

// Model configuration
const MODEL_NAME = 'Xenova/twitter-roberta-base-sentiment-latest';
const MAX_MODEL_LOAD_ATTEMPTS = 3;

// Global state
let transformers: any = null;
let modelLoadAttempts = 0;

/**
 * Check if an error is related to corrupted cache files
 */
function isCorruptedCacheError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();
  const corruptedIndicators = [
    'corrupted',
    'invalid or corrupted',
    'error reading',
    'cannot read',
    'failed to read',
    'bad magic number',
    'invalid format',
    'unexpected end of file',
    'premature end',
    'file appears to be corrupted',
  ];

  return corruptedIndicators.some((indicator) =>
    errorMessage.includes(indicator),
  );
}

/**
 * Clear potentially corrupted model cache files
 */
async function clearModelCache(): Promise<void> {
  // Multiple possible cache locations in a monorepo structure
  const possibleCacheDirs = [
    path.join(process.cwd(), '.cache', 'huggingface', 'hub'),
    path.join(process.cwd(), 'node_modules', '.cache', 'huggingface'),
    path.join(process.cwd(), '..', '..', '.cache', 'huggingface', 'hub'),
    path.join(
      process.cwd(),
      '..',
      '..',
      'node_modules',
      '.cache',
      'huggingface',
    ),
    path.join(process.env.HOME || '~', '.cache', 'huggingface', 'hub'),
  ];

  let cacheClearedCount = 0;

  for (const modelCacheDir of possibleCacheDirs) {
    if (!modelCacheDir) continue;

    try {
      await fs.access(modelCacheDir);
      console.log(`🔍 Found cache at: ${modelCacheDir}`);

      // If it exists, remove it
      await fs.rm(modelCacheDir, { recursive: true, force: true });
      console.log(`✅ Successfully cleared cache at: ${modelCacheDir}`);
      cacheClearedCount++;
    } catch (error) {
      // Directory doesn't exist, which is fine
      console.log(`ℹ️ No cache found at: ${modelCacheDir}`);
    }
  }

  if (cacheClearedCount === 0) {
    console.log('⚠️ No cache directories found to clear');
  } else {
    console.log(
      `✅ Successfully cleared ${cacheClearedCount} cache location(s)`,
    );
  }
}

/**
 * Analyze sentiment using Hugging Face transformers (server-side only)
 */
async function analyzeTransformersSentiment(
  text: string,
): Promise<SentimentScore> {
  // Check for environment-based disabling
  if (
    process.env.DISABLE_SENTIMENT_ANALYSIS === 'true' ||
    process.env.ENABLE_ML_MODELS === 'false'
  ) {
    console.log('ℹ️ Sentiment analysis disabled due to resource constraints');
    return {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 1,
      mode: 'accurate',
      disabled: true,
      disabledReason: 'Disabled via environment variable',
    };
  }

  // Initialize transformers if not already loaded
  if (!transformers) {
    try {
      modelLoadAttempts++;
      const { pipeline } = await import('@huggingface/transformers');
      transformers = await pipeline('sentiment-analysis', MODEL_NAME);
      console.log('✅ Successfully loaded sentiment analysis model');
    } catch (modelError) {
      console.error('❌ Model loading error:', modelError);

      // Check if this is a corrupted cache error and we haven't exceeded max attempts
      if (
        isCorruptedCacheError(modelError) &&
        modelLoadAttempts <= MAX_MODEL_LOAD_ATTEMPTS
      ) {
        console.warn(
          `⚠️ Model loading failed (attempt ${modelLoadAttempts}/${MAX_MODEL_LOAD_ATTEMPTS}), attempting cache clear...`,
        );

        // Clear the corrupted cache
        await clearModelCache();

        // Wait a moment before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Retry loading the model
        try {
          const { pipeline } = await import('@huggingface/transformers');
          transformers = await pipeline('sentiment-analysis', MODEL_NAME);
          console.log('✅ Successfully loaded model after cache clear');
        } catch (retryError) {
          console.error(
            `❌ Model loading failed again after cache clear:`,
            retryError,
          );
          throw retryError;
        }
      } else {
        // Either not a cache error or exceeded max attempts
        throw modelError;
      }
    }
  }

  // Get results and try to get all scores
  const results = await transformers(text, { return_all_scores: true });

  // Check if we got all scores or just the top one
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  if (Array.isArray(results) && results.length > 1) {
    // We got all scores
    results.forEach((result: any) => {
      if (result.label === 'LABEL_2' || result.label === 'positive') {
        positive = result.score;
      } else if (result.label === 'LABEL_0' || result.label === 'negative') {
        negative = result.score;
      } else if (result.label === 'LABEL_1' || result.label === 'neutral') {
        neutral = result.score;
      }
    });
  } else {
    // We only got the top prediction, need to handle differently
    const result = Array.isArray(results) ? results[0] : results;
    const confidence = result.score;

    // Map the single result to appropriate class
    if (result.label === 'LABEL_2' || result.label === 'positive') {
      positive = confidence;
      negative = (1 - confidence) * 0.3;
      neutral = (1 - confidence) * 0.7;
    } else if (result.label === 'LABEL_0' || result.label === 'negative') {
      negative = confidence;
      positive = (1 - confidence) * 0.3;
      neutral = (1 - confidence) * 0.7;
    } else {
      neutral = confidence;
      positive = (1 - confidence) * 0.4;
      negative = (1 - confidence) * 0.6;
    }
  }

  // Determine the correct label based on highest confidence
  let label: 'positive' | 'negative' | 'neutral';
  let confidence: number;
  let compound: number;

  if (positive >= negative && positive >= neutral) {
    label = 'positive';
    confidence = positive;
    compound = positive;
  } else if (negative >= positive && negative >= neutral) {
    label = 'negative';
    confidence = negative;
    compound = -negative;
  } else {
    label = 'neutral';
    confidence = neutral;
    compound = 0;
  }

  return {
    compound,
    positive,
    negative,
    neutral,
    label,
    confidence,
    mode: 'accurate',
  };
}

/**
 * Main sentiment analysis function (server-side)
 */
export async function analyzeSentiment(
  text: string,
  detailed = false,
  forceDisable = false,
): Promise<SentimentScore | number> {
  // Return disabled sentiment analysis for low-memory systems
  if (forceDisable) {
    const disabledScore: SentimentScore = {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 0,
      mode: 'accurate',
      disabled: true,
      disabledReason: 'Sentiment Analysis disabled due to memory constraints',
    };
    return detailed ? disabledScore : disabledScore.compound;
  }

  if (!text || text.trim().length === 0) {
    const neutralScore: SentimentScore = {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 1,
      mode: 'accurate',
    };
    return detailed ? neutralScore : neutralScore.compound;
  }

  try {
    const result = await analyzeTransformersSentiment(text);
    return detailed ? result : result.compound;
  } catch (error) {
    console.error('Sentiment analysis error:', error);

    // If this is a corrupted cache error and we haven't exceeded max attempts,
    // reset transformers to null so it can be retried on next call
    if (
      isCorruptedCacheError(error) &&
      modelLoadAttempts < MAX_MODEL_LOAD_ATTEMPTS
    ) {
      transformers = null;
      console.log('🔄 Resetting transformers cache for retry on next request');
    }

    // Return neutral sentiment as fallback
    const neutralScore: SentimentScore = {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 1,
      mode: 'accurate',
    };
    return detailed ? neutralScore : neutralScore.compound;
  }
}

/**
 * Clear transformers cache (for testing/debugging)
 */
export async function clearTransformersCache(): Promise<void> {
  try {
    await clearModelCache();
    transformers = null;
    modelLoadAttempts = 0;
    console.log('✅ Successfully cleared transformers cache and reset state');
  } catch (error) {
    console.error('❌ Failed to clear transformers cache:', error);
    throw error;
  }
}
