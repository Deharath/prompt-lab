// Simple test of sentiment analysis logic directly
import { analyzeSentiment } from './packages/api/src/lib/sentimentService.js';

async function testSentimentDirect() {
  console.log('=== Testing sentiment analysis directly ===\n');

  const testTexts = [
    {
      text: 'This laptop is amazing! The battery lasts all day and it runs incredibly fast. Best purchase I ever made!',
      expected: 'positive',
    },
    {
      text: 'This laptop is terrible! The battery dies quickly and it crashes constantly. Very disappointing purchase.',
      expected: 'negative',
    },
    {
      text: 'This laptop is okay. It works fine for basic tasks. The price is reasonable.',
      expected: 'neutral',
    },
    {
      text: 'The weather is nice today.',
      expected: 'positive',
    },
  ];

  for (const test of testTexts) {
    console.log(`Testing: "${test.text}"`);
    console.log(`Expected: ${test.expected}`);

    try {
      const result = await analyzeSentiment(test.text);
      console.log('✓ Result:', JSON.stringify(result, null, 2));

      const frontendDisplay = `${result.label.charAt(0).toUpperCase()}${result.label.slice(1)} (${(result.confidence * 100).toFixed(1)}%)`;
      console.log(`📱 Frontend would show: "${frontendDisplay}"`);

      const correct = result.label === test.expected;
      console.log(
        correct ? '✅ Correct prediction' : '❌ Incorrect prediction',
      );
    } catch (error) {
      console.error('❌ Error:', error.message);
    }

    console.log('─'.repeat(60));
  }
}

testSentimentDirect();
