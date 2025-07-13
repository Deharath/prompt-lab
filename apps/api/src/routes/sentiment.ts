import { Router } from 'express';
import { log } from '@prompt-lab/evaluation-engine';

const router = Router();

/**
 * POST /api/sentiment
 * Analyze sentiment of provided text
 */
router.post('/', async (req, res) => {
  try {
    const { text, detailed = false } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Text field is required and must be a string',
        code: 'INVALID_INPUT',
      });
    }

    if (text.length > 10000) {
      return res.status(413).json({
        error: 'Text too long. Maximum length is 10,000 characters',
        code: 'TEXT_TOO_LARGE',
      });
    }

    // Use consolidated sentiment analysis
    const { analyzeSentiment } = await import('../lib/sentimentAnalysis.js');
    const sentiment = await analyzeSentiment(text, detailed);

    res.json({
      success: true,
      data: sentiment,
    });
  } catch (error) {
    log.error(
      'Sentiment analysis error',
      { endpoint: '/api/sentiment' },
      error instanceof Error ? error : new Error(String(error)),
    );

    res.status(500).json({
      error: 'Internal server error during sentiment analysis',
      code: 'SENTIMENT_ANALYSIS_FAILED',
    });
  }
});

export default router;
