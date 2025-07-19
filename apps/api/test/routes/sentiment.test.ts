import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';

// Mock the sentiment analysis module
vi.mock('../../src/lib/sentimentAnalysis.js', () => ({
  analyzeSentiment: vi.fn(),
}));

describe('Sentiment API', () => {
  describe('POST /api/sentiment', () => {
    it('should analyze sentiment of text', async () => {
      const { analyzeSentiment } = await import(
        '../../src/lib/sentimentAnalysis.js'
      );
      vi.mocked(analyzeSentiment).mockResolvedValue({
        score: 0.8,
        label: 'positive',
        confidence: 0.95,
      });

      const response = await request(app)
        .post('/api/sentiment')
        .send({ text: 'I love this product!' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('score');
      expect(response.body.data).toHaveProperty('label');
      expect(response.body.data).toHaveProperty('confidence');
      expect(analyzeSentiment).toHaveBeenCalledWith(
        'I love this product!',
        false,
      );
    });

    it('should support detailed sentiment analysis', async () => {
      const { analyzeSentiment } = await import(
        '../../src/lib/sentimentAnalysis.js'
      );
      vi.mocked(analyzeSentiment).mockResolvedValue({
        score: 0.8,
        label: 'positive',
        confidence: 0.95,
        details: {
          positive: 0.8,
          negative: 0.1,
          neutral: 0.1,
        },
      });

      const response = await request(app)
        .post('/api/sentiment')
        .send({ text: 'I love this product!', detailed: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('details');
      expect(analyzeSentiment).toHaveBeenCalledWith(
        'I love this product!',
        true,
      );
    });

    it('should reject missing text', async () => {
      const response = await request(app)
        .post('/api/sentiment')
        .send({})
        .expect(400);

      expect(response.body.error).toBe(
        'Text field is required and must be a string',
      );
      expect(response.body.code).toBe('INVALID_INPUT');
    });

    it('should reject non-string text', async () => {
      const response = await request(app)
        .post('/api/sentiment')
        .send({ text: 123 })
        .expect(400);

      expect(response.body.error).toBe(
        'Text field is required and must be a string',
      );
      expect(response.body.code).toBe('INVALID_INPUT');
    });

    it('should reject text that is too long', async () => {
      const longText = 'a'.repeat(10001);

      const response = await request(app)
        .post('/api/sentiment')
        .send({ text: longText })
        .expect(413);

      expect(response.body.error).toBe(
        'Text too long. Maximum length is 10,000 characters',
      );
      expect(response.body.code).toBe('TEXT_TOO_LARGE');
    });

    it('should handle sentiment analysis errors', async () => {
      const { analyzeSentiment } = await import(
        '../../src/lib/sentimentAnalysis.js'
      );
      vi.mocked(analyzeSentiment).mockRejectedValue(
        new Error('Analysis failed'),
      );

      const response = await request(app)
        .post('/api/sentiment')
        .send({ text: 'Test text' })
        .expect(500);

      expect(response.body.error).toBe(
        'Internal server error during sentiment analysis',
      );
      expect(response.body.code).toBe('SENTIMENT_ANALYSIS_FAILED');
    });

    it('should handle empty text string', async () => {
      const response = await request(app)
        .post('/api/sentiment')
        .send({ text: '' })
        .expect(400);

      expect(response.body.error).toBe(
        'Text field is required and must be a string',
      );
      expect(response.body.code).toBe('INVALID_INPUT');
    });

    it('should handle whitespace-only text', async () => {
      const { analyzeSentiment } = await import(
        '../../src/lib/sentimentAnalysis.js'
      );
      vi.mocked(analyzeSentiment).mockResolvedValue({
        score: 0.5,
        label: 'neutral',
        confidence: 0.9,
      });

      const response = await request(app)
        .post('/api/sentiment')
        .send({ text: '   ' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(analyzeSentiment).toHaveBeenCalledWith('   ', false);
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/sentiment')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express will handle malformed JSON with a 400 error
    });
  });
});
