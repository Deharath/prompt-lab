/**
 * Test the readability service directly
 */
import { calculateReadabilityScores } from '../../packages/api/dist/src/lib/readabilityService.js';

const testText = "The quick brown fox jumps over the lazy dog. This is a simple sentence to test readability metrics. The weather is nice today and I feel happy about the progress we've made.";

console.log('Testing readability service...');
console.log('Text:', testText);

calculateReadabilityScores(testText)
  .then(scores => {
    console.log('Readability scores:', scores);
    
    if (scores.fleschReadingEase === 0) {
      console.log('WARNING: Flesch Reading Ease is 0, this indicates a problem');
    } else {
      console.log('✓ Flesch Reading Ease working:', scores.fleschReadingEase);
    }
  })
  .catch(error => {
    console.error('Error testing readability service:', error);
  });
