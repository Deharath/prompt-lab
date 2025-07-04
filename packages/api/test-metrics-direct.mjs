/**
 * Test the main metrics calculation function
 */
import { calculateMetrics } from './dist/src/lib/metrics.js';

const testText = "The quick brown fox jumps over the lazy dog. This is a simple sentence to test readability metrics. The weather is nice today and I feel happy about the progress we've made.";

const testMetrics = [
  { id: 'flesch_reading_ease' },
  { id: 'flesch_kincaid' },
  { id: 'sentiment' },
  { id: 'word_count' },
  { id: 'sentence_count' },
  { id: 'keywords', input: 'fox,dog,weather,happy' }
];

console.log('Testing main metrics calculation...');
console.log('Text:', testText);

calculateMetrics(testText, testMetrics)
  .then(results => {
    console.log('Metrics results:', results);
    
    console.log('\n=== Validation ===');
    
    if (results.flesch_reading_ease !== undefined) {
      console.log('✓ Flesch Reading Ease:', results.flesch_reading_ease);
    } else {
      console.log('✗ Flesch Reading Ease missing');
    }
    
    if (results.sentiment !== undefined) {
      console.log('✓ Sentiment:', results.sentiment);
    } else {
      console.log('✗ Sentiment missing');
    }
    
    if (results.word_count !== undefined) {
      console.log('✓ Word count:', results.word_count);
    } else {
      console.log('✗ Word count missing');
    }
    
    if (results.keywords !== undefined) {
      console.log('✓ Keywords:', results.keywords);
    } else {
      console.log('✗ Keywords missing');
    }
  })
  .catch(error => {
    console.error('Error testing metrics:', error);
  });
