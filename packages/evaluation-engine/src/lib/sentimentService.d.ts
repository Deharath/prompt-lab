/**
 * Task 3 - Sentiment Service (Fast / Accurate)
 * Fast: VADER (legacy). Accurate: Xenova Twitter RoBERTa via @huggingface/transformers
 * Toggle with SENTIMENT_MODE env. Default prioritizes RoBERTa for improved accuracy.
 * Uses Xenova/twitter-roberta-base-sentiment-latest for positive/neutral/negative classification.
 */
import { Request, Response } from 'express';
export interface SentimentScore {
  compound: number;
  positive: number;
  negative: number;
  neutral: number;
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  mode: 'fast' | 'accurate';
}
export interface SentimentError {
  error: string;
  code: number;
}
/**
 * Reset the transformers cache (for testing)
 */
export declare function resetTransformersCache(): void;
/**
 * Main sentiment analysis function
 */
export declare function analyzeSentiment(
  text: string,
  detailed?: boolean,
): Promise<SentimentScore | number>;
/**
 * Express route handler for sentiment analysis
 */
export declare function sentimentHandler(
  req: Request,
  res: Response,
): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to validate request format
 */
export declare function validateSentimentRequest(
  req: Request,
  res: Response,
  next: () => void,
): Response<any, Record<string, any>> | undefined;
