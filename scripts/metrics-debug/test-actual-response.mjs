/**
 * Test readability with the actual job response text
 */
import { calculateReadabilityScores } from '../../packages/evaluation-engine/dist/src/lib/readabilityService.js';

const actualJobResponse = `### Main Topic
Recent developments in artificial intelligence technology and their implications for various industries.

### Key Points
- **Rapid Advancement**: AI technology is evolving quickly, impacting numerous sectors.
- **Opportunities and Challenges**: The progress in AI brings significant benefits, but it also poses challenges that need to be addressed.
- **Focus on Reliability**: Researchers are prioritizing the development of AI systems that are reliable and can be trusted by users.
- **Interpretability**: There is an ongoing effort to make AI systems more interpretable, ensuring users can understand and make sense of AI decisions.
- **Societal Benefits**: The ultimate goal of AI advancements is to create systems that are beneficial for society as a whole.

### Overall Conclusion or Implications
The rapid development of artificial intelligence presents a dual-edged sword; while it offers substantial opportunities for innovation and efficiency across various industries, it also raises critical challenges that must be managed. The emphasis on reliability, interpretability, and societal benefit highlights the need for responsible AI development to ensure that these technologies contribute positively to society.`;

console.log('Testing readability with actual job response...');
console.log('Text length:', actualJobResponse.length, 'characters');
console.log('Text preview:', actualJobResponse.substring(0, 200) + '...');

calculateReadabilityScores(actualJobResponse)
  .then((scores) => {
    console.log('\nReadability scores:', scores);

    if (scores.fleschReadingEase === 0) {
      console.log('\n❌ PROBLEM FOUND: Flesch Reading Ease is 0!');
      console.log(
        'This indicates an issue with the text-readability-ts calculation for this specific text.',
      );

      // Test with simpler text to see if it's the formatting
      const simpleText = actualJobResponse
        .replace(/###/g, '')
        .replace(/\*\*/g, '')
        .replace(/- /g, '')
        .replace(/\n+/g, ' ')
        .trim();

      console.log('\nTesting with simplified text (no markdown)...');
      return calculateReadabilityScores(simpleText);
    } else {
      console.log('✓ Flesch Reading Ease working:', scores.fleschReadingEase);
      return null;
    }
  })
  .then((simplifiedScores) => {
    if (simplifiedScores) {
      console.log('Simplified text scores:', simplifiedScores);

      if (simplifiedScores.fleschReadingEase === 0) {
        console.log(
          '❌ Still 0 even with simplified text - deeper issue with text-readability-ts',
        );
      } else {
        console.log(
          '✓ Simplified text works - the issue is with markdown formatting',
        );
      }
    }
  })
  .catch((error) => {
    console.error('Error testing readability:', error);
  });
