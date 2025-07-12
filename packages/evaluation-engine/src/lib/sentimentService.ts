/**
 * Sentiment Analysis Service - API Client
 * Provides sentiment analysis by calling the server-side API endpoint
 * Fallback mechanisms for production robustness.
 */

import { Request, Response } from 'express';
import { log } from '../utils/logger.js';

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

/**
 * Get the API base URL for sentiment analysis
 */
function getApiBaseUrl(): string {
  // In production, this would be the actual API URL
  // In development, use localhost
  return process.env.API_BASE_URL || 'http://localhost:3000';
}

/**
 * Call the sentiment analysis API
 */
async function callSentimentApi(text: string, detailed: boolean): Promise<SentimentScore> {
  const apiUrl = `${getApiBaseUrl()}/api/sentiment`;
  
  try {
    // Use dynamic import to avoid bundling fetch polyfill unless needed
    const { default: fetch } = await import('node-fetch');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, detailed }),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result.data;
  } catch (error) {
    log.error(
      'Failed to call sentiment API',
      { apiUrl, textLength: text.length },
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

/**
 * Main sentiment analysis function with API fallback
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
    // Try to call the API first
    const result = await callSentimentApi(text, detailed);
    return detailed ? result : result.compound;
  } catch (error) {
    log.warn(
      'Sentiment API call failed, falling back to neutral sentiment',
      { 
        textLength: text.length,
        error: error instanceof Error ? error.message : String(error) 
      },
    );

    // Return neutral sentiment as fallback
    const neutralScore: SentimentScore = {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 1,
      mode: 'accurate',
      disabled: true,
      disabledReason: 'API unavailable, using fallback',
    };
    return detailed ? neutralScore : neutralScore.compound;
  }
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
        code: 'INVALID_INPUT',
      });
    }

    const sentiment = await analyzeSentiment(text, true);

    res.json({
      success: true,
      data: sentiment,
    });
  } catch (error) {
    log.error(
      'Sentiment analysis error',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    res.status(500).json({
      error: 'Internal server error during sentiment analysis',
      code: 'SENTIMENT_ANALYSIS_FAILED',
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
      code: 'MISSING_TEXT',
    });
  }

  if (typeof text !== 'string') {
    return res.status(400).json({
      error: 'Text field must be a string',
      code: 'INVALID_TEXT_TYPE',
    });
  }

  if (text.length > 10000) {
    return res.status(413).json({
      error: 'Text too long. Maximum length is 10,000 characters',
      code: 'TEXT_TOO_LONG',
    });
  }

  next();
}

/**
 * Clear transformers cache (now a no-op since we use API)
 */
export async function clearTransformersCache(): Promise<void> {
  log.info('clearTransformersCache called - no-op in API mode');
}

/**
 * Reset transformers cache (for testing - now a no-op)
 */
export function resetTransformersCache(): void {
  log.info('resetTransformersCache called - no-op in API mode');
}