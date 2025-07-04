import { analyzeSentiment } from './packages/api/dist/src/lib/sentimentService.js';
import { calculateReadabilityScores } from './packages/api/dist/src/lib/readabilityService.js';

async function testUpdatedMetrics() {
  console.log('Testing updated metrics with DistilBERT and text-readability...\n');
  
  const testTexts = [
    'I love this amazing product! It is absolutely fantastic and wonderful!',
    'This is terrible and awful. I hate everything about it.',
    'This is a neutral statement about the weather today.',
  ];

  for (const text of testTexts) {
    console.log(`Testing: "${text}"`);
    console.log('═'.repeat(60));
    
    try {
      // Test sentiment analysis
      console.log('🎭 SENTIMENT ANALYSIS:');
      
      // Test fast mode (VADER)
      process.env.SENTIMENT_MODE = 'fast';
      const fastResult = await analyzeSentiment(text);
      console.log(`  Fast (VADER): ${fastResult.compound.toFixed(3)} [${fastResult.mode}]`);
      
      // Test accurate mode (DistilBERT)
      process.env.SENTIMENT_MODE = 'accurate';
      const accurateResult = await analyzeSentiment(text);
      console.log(`  Accurate (DistilBERT): ${accurateResult.compound.toFixed(3)} [${accurateResult.mode}]`);
      
      // Test readability analysis
      console.log('\n📖 READABILITY ANALYSIS:');
      const readability = await calculateReadabilityScores(text);
      console.log(`  Flesch Reading Ease: ${readability.fleschReadingEase.toFixed(1)}`);
      console.log(`  Flesch-Kincaid Grade: ${readability.fleschKincaid.toFixed(1)}`);
      console.log(`  SMOG Index: ${readability.smog.toFixed(1)}`);
      
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
  }
  
  // Reset to default
  process.env.SENTIMENT_MODE = 'accurate';
  console.log('✅ Tests completed. DistilBERT is now the primary sentiment analysis method.');
}

testUpdatedMetrics().catch(console.error);
