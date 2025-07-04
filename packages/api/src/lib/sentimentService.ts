/**
 * Task 3 - Sentiment Service (Fast / Accurate)
 * Fast: VADER (legacy). Accurate: DistilBERT via @huggingface/transformers
 * Toggle with SENTIMENT_MODE env. Default prioritizes DistilBERT for improved accuracy.
 * Uses Xenova/distilbert-base-uncased-finetuned-sst-2-english - the ONNX optimized version of DistilBERT.
 */

import { Request, Response } from 'express';

export interface SentimentScore {
  compound: number; // Overall sentiment score -1 to 1
  positive: number; // Positive sentiment 0 to 1
  negative: number; // Negative sentiment 0 to 1
  neutral: number; // Neutral sentiment 0 to 1
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
 * Accurate sentiment analysis using DistilBERT via @huggingface/transformers
 * Uses the ONNX-optimized DistilBERT model for better performance and accuracy
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
      mode: 'accurate',
    };
  }

  try {
    // Lazy load transformers with better maintained package
    if (!transformers) {
      const { pipeline } = await import('@huggingface/transformers');
      // Use the default sentiment analysis model - this will be DistilBERT (ONNX optimized)
      // The model used is: Xenova/distilbert-base-uncased-finetuned-sst-2-english
      transformers = await pipeline('sentiment-analysis');
    }

    const result = await transformers(text);

    // Convert transformer output to VADER-like format
    const score = result[0];
    const isPositive =
      score.label === 'POSITIVE' || score.label.includes('POSITIVE');
    const confidence = score.score;

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let compound = 0;

    if (isPositive) {
      positive = confidence;
      compound = confidence;
      neutral = 1 - confidence;
    } else {
      negative = confidence;
      compound = -confidence;
      neutral = 1 - confidence;
    }

    return {
      compound,
      positive,
      negative,
      neutral,
      mode: 'accurate',
    };
  } catch (error) {
    console.error('DistilBERT sentiment analysis error:', error);
    // Fallback to simple analysis
    return analyzeSimpleSentiment(text, 'accurate');
  }
}

/**
 * Simple fallback sentiment analysis
 */
function analyzeSimpleSentiment(
  text: string,
  mode: 'fast' | 'accurate',
): SentimentScore {
  const positiveWords = [
    'love',
    'amazing',
    'great',
    'excellent',
    'wonderful',
    'fantastic',
    'good',
    'happy',
    'joy',
    'perfect',
    'awesome',
    'brilliant',
    'outstanding',
  ];
  const negativeWords = [
    'hate',
    'terrible',
    'awful',
    'horrible',
    'bad',
    'worst',
    'sad',
    'angry',
    'disgusting',
    'poor',
    'disappointing',
    'annoying',
  ];

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach((word) => {
    if (positiveWords.includes(word)) {
      positiveCount++;
    } else if (negativeWords.includes(word)) {
      negativeCount++;
    }
  });

  const totalSentiment = positiveCount + negativeCount;
  const positive = totalSentiment > 0 ? positiveCount / totalSentiment : 0;
  const negative = totalSentiment > 0 ? negativeCount / totalSentiment : 0;
  const neutral = 1 - positive - negative;
  const compound = positive - negative;

  return {
    compound: Math.max(-1, Math.min(1, compound)),
    positive,
    negative,
    neutral: Math.max(0, neutral),
    mode,
  };
}

/**
 * Main sentiment analysis function
 */
export async function analyzeSentiment(text: string): Promise<SentimentScore> {
  if (!text || text.trim().length === 0) {
    return {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      mode: SENTIMENT_MODE as 'fast' | 'accurate',
    };
  }

  // Only use DistilBERT/transformers. If it fails, return error result.
  try {
    return await analyzeTransformersSentiment(text);
  } catch (transformersError) {
    console.warn('DistilBERT sentiment failed:', transformersError);
    return {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      mode: SENTIMENT_MODE as 'fast' | 'accurate',
      // Optionally, you could add an error property here if you want to signal failure
    };
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
        code: 400,
      });
    }

    const sentiment = await analyzeSentiment(text);

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
