import { analyzeSentiment } from './packages/api/dist/src/lib/sentimentService.js';

async function testSentiment() {
  console.log('Testing updated sentiment analysis...');
  
  const testTexts = [
    'I love this amazing product!',
    'This is terrible and awful.',
    'This is a neutral statement about weather.',
  ];

  for (const text of testTexts) {
    try {
      console.log(`Testing: "${text}"`);
      const result = await analyzeSentiment(text);
      console.log(`Mode: ${result.mode}, Compound: ${result.compound.toFixed(3)}`);
      console.log('---');
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testSentiment().catch(console.error);
