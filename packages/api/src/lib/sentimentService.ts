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
let vader: any;
let transformers: any;

/**
 * Fast sentiment analysis using VADER
 */
async function analyzeVaderSentiment(text: string): Promise<SentimentScore> {
  if (!text || text.trim().length === 0) {
    return {
      compound: 0,
      positive: 0,
      negative: 0,
      neutral: 1,
      label: 'neutral',
      confidence: 1,
      mode: 'fast',
    };
  }

  try {
    // Lazy load VADER with dynamic import for ESM compatibility
    if (!vader) {
      vader = await import('vader-sentiment');
    }

    const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);

    // Determine label and confidence from VADER scores
    let label: 'positive' | 'negative' | 'neutral';
    let confidence: number;

    if (result.compound >= 0.05) {
      label = 'positive';
      confidence = result.pos;
    } else if (result.compound <= -0.05) {
      label = 'negative';
      confidence = result.neg;
    } else {
      label = 'neutral';
      confidence = result.neu;
    }

    return {
      compound: result.compound,
      positive: result.pos,
      negative: result.neg,
      neutral: result.neu,
      label,
      confidence,
      mode: 'fast',
    };
  } catch (error) {
    console.error('VADER sentiment analysis error:', error);
    // Fallback to simple analysis
    return analyzeSimpleSentiment(text, 'fast');
  }
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
    // Fallback to VADER or simple analysis
    if (SENTIMENT_MODE !== 'fast') {
      return analyzeVaderSentiment(text);
    }
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

  // Determine label and confidence
  let label: 'positive' | 'negative' | 'neutral';
  let confidence: number;

  if (compound > 0.1) {
    label = 'positive';
    confidence = positive;
  } else if (compound < -0.1) {
    label = 'negative';
    confidence = negative;
  } else {
    label = 'neutral';
    confidence = neutral;
  }

  return {
    compound: Math.max(-1, Math.min(1, compound)),
    positive,
    negative,
    neutral: Math.max(0, neutral),
    label,
    confidence,
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
      label: 'neutral',
      confidence: 1,
      mode: SENTIMENT_MODE as 'fast' | 'accurate',
    };
  }

  // Prioritize Twitter RoBERTa (more accurate) over VADER (faster but less accurate)
  if (SENTIMENT_MODE === 'fast') {
    // Fast mode: Try VADER first, fallback to RoBERTa if needed
    try {
      return await analyzeVaderSentiment(text);
    } catch (vaderError) {
      console.warn(
        'VADER sentiment failed, trying Twitter RoBERTa:',
        vaderError,
      );
      try {
        return await analyzeTransformersSentiment(text);
      } catch (transformersError) {
        console.warn(
          'Twitter RoBERTa sentiment failed, using simple fallback:',
          transformersError,
        );
        return analyzeSimpleSentiment(text, 'fast');
      }
    }
  } else {
    // Accurate mode: Try Twitter RoBERTa first for better accuracy
    try {
      return await analyzeTransformersSentiment(text);
    } catch (transformersError) {
      console.warn(
        'Twitter RoBERTa sentiment failed, trying VADER:',
        transformersError,
      );
      try {
        return await analyzeVaderSentiment(text);
      } catch (vaderError) {
        console.warn(
          'Both Twitter RoBERTa and VADER failed, using simple fallback:',
          vaderError,
        );
        return analyzeSimpleSentiment(text, 'accurate');
      }
    }
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
