// Quick test script to verify sentiment service behavior
import { analyzeSentiment } from './packages/evaluation-engine/src/lib/sentimentService.js';

async function testSentiment() {
  console.log('🔧 Environment check:');
  console.log(
    'DISABLE_SENTIMENT_ANALYSIS:',
    process.env.DISABLE_SENTIMENT_ANALYSIS,
  );
  console.log('ENABLE_ML_MODELS:', process.env.ENABLE_ML_MODELS);
  console.log('');

  console.log('🧪 Testing sentiment analysis...');
  try {
    const result = await analyzeSentiment('This is a test message');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSentiment();
