/**
 * Consolidated Sentiment Analysis Service
 * All transformer logic and sentiment processing in one place
 */

import { log } from '@prompt-lab/evaluation-engine';

export interface SentimentScore {
  compound: number; // Overall sentiment score -1 to 1
  positive: number; // Positive sentiment confidence 0 to 1
  negative: number; // Negative sentiment confidence 0 to 1
  neutral: number; // Neutral sentiment confidence 0 to 1
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
    'protobuf parsing failed',
    'model.onnx failed',
    'invalid onnx model',
    'bad magic number',
    'unexpected end of file',
  ];

  return corruptedIndicators.some((indicator) =>
    errorMessage.includes(indicator),
  );
}

/**
 * Clear potentially corrupted model cache files
 */
async function clearModelCache(): Promise<void> {
  const { promises: fs } = await import('fs');
  const path = await import('path');

  const possibleCacheDirs = [
    path.join(process.cwd(), '.cache', 'huggingface', 'hub'),
    path.join(process.cwd(), 'node_modules', '.cache', 'huggingface'),
    path.join(process.env.HOME || '~', '.cache', 'huggingface', 'hub'),
  ];

  let cacheClearedCount = 0;

  for (const modelCacheDir of possibleCacheDirs) {
    if (!modelCacheDir) continue;

    try {
      await fs.access(modelCacheDir);
      await fs.rm(modelCacheDir, { recursive: true, force: true });
      log.info('Successfully cleared cache', { path: modelCacheDir });
      cacheClearedCount++;
    } catch (error) {
      // Directory doesn't exist, which is fine
    }
  }

  if (cacheClearedCount > 0) {
    log.info('Successfully cleared cache locations', {
      count: cacheClearedCount,
    });
  }
}

/**
 * Analyze sentiment using RoBERTa transformer model with trinary classification
 */
async function analyzeTransformersSentiment(
  text: string,
): Promise<SentimentScore> {
  // Check for environment-based disabling
  if (
    process.env.DISABLE_SENTIMENT_ANALYSIS === 'true' ||
    process.env.ENABLE_ML_MODELS === 'false'
  ) {
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
      log.info('Successfully loaded sentiment analysis model', {
        model: MODEL_NAME,
      });
    } catch (modelError) {
      log.error(
        'Model loading error',
        {},
        modelError instanceof Error
          ? modelError
          : new Error(String(modelError)),
      );

      // Check if this is a corrupted cache error and we haven't exceeded max attempts
      if (
        isCorruptedCacheError(modelError) &&
        modelLoadAttempts <= MAX_MODEL_LOAD_ATTEMPTS
      ) {
        log.warn('Model loading failed, attempting cache clear', {
          attempt: modelLoadAttempts,
          maxAttempts: MAX_MODEL_LOAD_ATTEMPTS,
        });

        await clearModelCache();
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Retry loading the model
        try {
          const { pipeline } = await import('@huggingface/transformers');
          transformers = await pipeline('sentiment-analysis', MODEL_NAME);
          log.info('Successfully loaded model after cache clear');
        } catch (retryError) {
          log.error(
            'Model loading failed again after cache clear',
            {},
            retryError instanceof Error
              ? retryError
              : new Error(String(retryError)),
          );
          throw retryError;
        }
      } else {
        throw modelError;
      }
    }
  }

  // Get results with all scores for trinary classification
  const results = await transformers(text, { return_all_scores: true });

  // Initialize scores
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  if (Array.isArray(results) && results.length > 1) {
    // We got all scores - RoBERTa gives us trinary classification
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
    // Only got top prediction
    const result = Array.isArray(results) ? results[0] : results;
    const confidence = result.score;

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
 * Main sentiment analysis function
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
    log.error(
      'Sentiment analysis error',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );

    // If this is a corrupted cache error and we haven't exceeded max attempts,
    // reset transformers to null so it can be retried on next call
    if (
      isCorruptedCacheError(error) &&
      modelLoadAttempts < MAX_MODEL_LOAD_ATTEMPTS
    ) {
      transformers = null;
      log.info('Resetting transformers cache for retry on next request');
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
    log.info('Successfully cleared transformers cache and reset state');
  } catch (error) {
    log.error(
      'Failed to clear transformers cache',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}
