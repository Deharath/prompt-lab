// Quick debug script to test sentiment analysis
const {
  analyzeSentiment,
} = require('../../packages/evaluation-engine/dist/src/lib/sentimentService.js');

async function testSentiment() {
  console.log('Testing sentiment analysis...');

  const testTexts = [
    'I love this amazing product!',
    'This is terrible and awful.',
    'This is a neutral statement about weather.',
    'I hate this but love the other thing.',
  ];

  for (const text of testTexts) {
    try {
      const result = await analyzeSentiment(text);
      console.log(`Text: "${text}"`);
      console.log(`Result:`, result);
      console.log('---');
    } catch (error) {
      console.error(`Error analyzing "${text}":`, error);
    }
  }
}

testSentiment().catch(console.error);
