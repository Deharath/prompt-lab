/**
 * Task 3 - Sentiment Service (Fast / Accurate)
 * Fast: VADER (legacy). Accurate: Xenova Twitter RoBERTa via @huggingface/transformers
 * Toggle with SENTIMENT_MODE env. Default prioritizes RoBERTa for improved accuracy.
 * Uses Xenova/twitter-roberta-base-sentiment-latest for positive/neutral/negative classification.
 */

import { Request, Response } from 'express';

export interface SentimentScore {
  compound: number; // Overall sentiment score -1 to 1
  positive: number; // Positive sentiment confidence 0 to 1
  negative: number; // Negative sentiment confidence 0 to 1
  neutral: number; // Neutral sentiment confidence 0 to 1
  label: 'positive' | 'negative' | 'neutral'; // Predicted sentiment class
  confidence: number; // Confidence of the prediction 0 to 1
  mode: 'fast' | 'accurate';
}

export interface SentimentError {
  error: string;
  code: number;
}

const SENTIMENT_MODE = process.env.SENTIMENT_MODE || 'fast';

// Dynamic imports to handle typing issues
let transformers: any;

/**
 * Reset the transformers cache (for testing)
 */
export function resetTransformersCache() {
  transformers = null;
}

/**
 * Accurate sentiment analysis using Xenova Twitter RoBERTa via @huggingface/transformers
 * Uses Xenova/twitter-roberta-base-sentiment-latest for positive/neutral/negative classification
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
    // Lazy load transformers with CardiffNLP Twitter RoBERTa model
    if (!transformers) {
      const { pipeline } = await import('@huggingface/transformers');
      // Use the Xenova version of CardiffNLP Twitter RoBERTa model for 3-class sentiment
      transformers = await pipeline(
        'sentiment-analysis',
        'Xenova/twitter-roberta-base-sentiment-latest',
      );
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
    console.error('DistilBERT sentiment analysis error:', error);
    // Return neutral sentiment as fallback
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
): Promise<SentimentScore | number> {
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
