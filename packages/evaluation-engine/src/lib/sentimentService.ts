/**
 * Task 3 - Sentiment Service (Accurate Trinary Classification)
 * Uses Xenova Twitter RoBERTa via @huggingface/transformers for accurate positive/neutral/negative classification.
 * Includes robust cache management for handling corrupted model files.
 */

import { Request, Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

export interface SentimentScore {
  compound: number; // Overall sentiment score -1 to 1
  positive: number; // Positive sentiment confidence 0 to 1
  negative: number; // Negative sentiment confidence 0 to 1
  neutral: number; // Neutral sentiment confidence 0 to 1
  label: 'positive' | 'negative' | 'neutral'; // Predicted sentiment class
  confidence: number; // Confidence of the prediction 0 to 1
  mode: 'accurate'; // Only accurate mode available
  disabled?: boolean; // Whether sentiment analysis was disabled
  disabledReason?: string; // Reason for disabling
}

export interface SentimentError {
  error: string;
  code: number;
}

const SENTIMENT_MODE = process.env.SENTIMENT_MODE || 'accurate';
const MODEL_NAME = 'Xenova/twitter-roberta-base-sentiment-latest';

// Dynamic imports to handle typing issues
let transformers: any;
let modelLoadAttempts = 0;
const MAX_MODEL_LOAD_ATTEMPTS = 2;

/**
 * Reset the transformers cache (for testing)
 */
export function resetTransformersCache() {
  transformers = null;
  modelLoadAttempts = 0;
}

/**
 * Clear corrupted model cache from all possible locations in monorepo
 */
async function clearModelCache(): Promise<void> {
  const possibleCachePaths = [
    // Root node_modules
    path.join(
      process.cwd(),
      'node_modules',
      '@huggingface',
      'transformers',
      '.cache',
    ),
    // Apps/api node_modules
    path.join(
      process.cwd(),
      'apps',
      'api',
      'node_modules',
      '@huggingface',
      'transformers',
      '.cache',
    ),
    // Apps/web node_modules
    path.join(
      process.cwd(),
      'apps',
      'web',
      'node_modules',
      '@huggingface',
      'transformers',
      '.cache',
    ),
    // Packages/evaluation-engine node_modules
    path.join(
      process.cwd(),
      'packages',
      'evaluation-engine',
      'node_modules',
      '@huggingface',
      'transformers',
      '.cache',
    ),
  ];

  let cacheClearedCount = 0;

  for (const cacheDir of possibleCachePaths) {
    const modelCacheDir = path.join(
      cacheDir,
      'Xenova',
      'twitter-roberta-base-sentiment-latest',
    );

    try {
      await fs.access(modelCacheDir);
      console.log(`🔍 Found corrupted cache at: ${modelCacheDir}`);

      // If it exists, remove it
      await fs.rm(modelCacheDir, { recursive: true, force: true });
      console.log(`✅ Successfully cleared cache at: ${modelCacheDir}`);
      cacheClearedCount++;
    } catch (error) {
      // Directory doesn't exist, which is fine - not all paths will have cache
      console.log(`ℹ️ No cache found at: ${modelCacheDir}`);
    }
  }

  if (cacheClearedCount === 0) {
    console.log('⚠️ No corrupted cache directories found to clear');
  } else {
    console.log(
      `✅ Successfully cleared ${cacheClearedCount} corrupted cache location(s)`,
    );
  }
}

/**
 * Check if error indicates corrupted model cache
 */
function isCorruptedCacheError(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';
  return (
    errorMessage.includes('Protobuf parsing failed') ||
    errorMessage.includes('model.onnx failed') ||
    errorMessage.includes('corrupted') ||
    errorMessage.includes('Invalid ONNX model')
  );
}

/**
 * Accurate sentiment analysis using Xenova Twitter RoBERTa via @huggingface/transformers
 * Uses Xenova/twitter-roberta-base-sentiment-latest for positive/neutral/negative classification
 * Includes robust error handling for corrupted model cache
 */
async function analyzeTransformersSentiment(
  text: string,
): Promise<SentimentScore> {
  if (!text || text.trim().length === 0) {
    return {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 1,
      mode: 'accurate',
    };
  }

  try {
    // Check if ML models are disabled due to resource constraints
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
        disabledReason:
          'Disabled due to memory constraints on production server',
      };
    }

    // Lazy load transformers with CardiffNLP Twitter RoBERTa model
    if (!transformers) {
      const { pipeline } = await import('@huggingface/transformers');

      try {
        // Use the Xenova version of CardiffNLP Twitter RoBERTa model for 3-class sentiment
        transformers = await pipeline('sentiment-analysis', MODEL_NAME);
      } catch (modelError) {
        modelLoadAttempts++;

        // Check if this is a corrupted cache error
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
        // For single prediction, we can't know the exact other scores
        // but we can estimate them roughly
        negative = (1 - confidence) * 0.3; // rough estimate
        neutral = (1 - confidence) * 0.7; // assume most of remainder is neutral
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

    // Return neutral sentiment as fallback (no inferior methods)
    return {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 1,
      mode: 'accurate',
    };
  }
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

  const result = await analyzeTransformersSentiment(text);
  return detailed ? result : result.compound;
}

/**
 * Express route handler for sentiment analysis
 */
export async function sentimentHandler(req: Request, res: Response) {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text field is required and must be a string',
        code: 400,
      });
    }

    const sentiment = await analyzeSentiment(text, true);

    res.json({
      success: true,
      data: sentiment,
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({
      error: 'Internal server error during sentiment analysis',
      code: 500,
    });
  }
}

/**
 * Middleware to validate request format
 */
export function validateSentimentRequest(
  req: Request,
  res: Response,
  next: () => void,
) {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'Missing required field: text',
      code: 400,
    });
  }

  if (typeof text !== 'string') {
    return res.status(400).json({
      error: 'Text field must be a string',
      code: 400,
    });
  }

  if (text.length > 10000) {
    return res.status(413).json({
      error: 'Text too long. Maximum length is 10,000 characters',
      code: 413,
    });
  }

  next();
}

/**
 * Manually clear the Hugging Face transformers cache
 * Useful for development and troubleshooting
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
