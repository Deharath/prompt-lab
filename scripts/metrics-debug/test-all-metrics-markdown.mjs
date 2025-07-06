/**
 * Test ALL metrics to see which ones are affected by markdown
 */
import { calculateMetrics } from '../../packages/evaluation-engine/dist/src/lib/metrics.js';

const markdownText = `### Main Topic
Recent developments in artificial intelligence technology and their implications for various industries.

### Key Points
- **Rapid Advancement**: AI technology is evolving quickly, impacting numerous sectors.
- **Opportunities and Challenges**: The progress in AI brings significant benefits, but it also poses challenges that need to be addressed.
- **Focus on Reliability**: Researchers are prioritizing the development of AI systems that are reliable and can be trusted by users.

### Overall Conclusion or Implications
The rapid development of artificial intelligence presents a dual-edged sword; while it offers substantial opportunities for innovation and efficiency across various industries.`;

const plainText = `Main Topic
Recent developments in artificial intelligence technology and their implications for various industries.

Key Points
Rapid Advancement: AI technology is evolving quickly, impacting numerous sectors.
Opportunities and Challenges: The progress in AI brings significant benefits, but it also poses challenges that need to be addressed.
Focus on Reliability: Researchers are prioritizing the development of AI systems that are reliable and can be trusted by users.

Overall Conclusion or Implications
The rapid development of artificial intelligence presents a dual-edged sword; while it offers substantial opportunities for innovation and efficiency across various industries.`;

const allMetrics = [
  { id: 'flesch_reading_ease' },
  { id: 'flesch_kincaid' },
  { id: 'smog' },
  { id: 'sentiment' },
  { id: 'word_count' },
  { id: 'sentence_count' },
  { id: 'avg_words_per_sentence' },
  { id: 'vocab_diversity' },
  {
    id: 'keywords',
    input: 'artificial,intelligence,technology,development,opportunities',
  },
  { id: 'precision', input: plainText }, // Compare markdown vs plain
  { id: 'recall', input: plainText },
  { id: 'f_score', input: plainText },
];

console.log('🔍 Testing ALL metrics with markdown vs plain text...\n');

async function testAllMetrics() {
  try {
    console.log(
      '📝 Markdown text preview:',
      markdownText.substring(0, 200) + '...\n',
    );

    const markdownResults = await calculateMetrics(markdownText, allMetrics);
    const plainResults = await calculateMetrics(plainText, allMetrics);

    console.log('=== COMPARISON RESULTS ===\n');

    Object.keys(markdownResults).forEach((metric) => {
      const markdownValue = markdownResults[metric];
      const plainValue = plainResults[metric];

      // Check if there's a significant difference
      let isDifferent = false;
      let status = '✓';

      if (typeof markdownValue === 'number' && typeof plainValue === 'number') {
        const percentDiff =
          (Math.abs(markdownValue - plainValue) /
            Math.max(markdownValue, plainValue, 0.001)) *
          100;
        if (percentDiff > 10) {
          // More than 10% difference
          isDifferent = true;
          status = '⚠️';
        }
      } else if (JSON.stringify(markdownValue) !== JSON.stringify(plainValue)) {
        isDifferent = true;
        status = '⚠️';
      }

      console.log(`${status} ${metric}:`);
      console.log(
        `   Markdown: ${typeof markdownValue === 'object' ? JSON.stringify(markdownValue) : markdownValue}`,
      );
      console.log(
        `   Plain:    ${typeof plainValue === 'object' ? JSON.stringify(plainValue) : plainValue}`,
      );

      if (isDifferent) {
        console.log(`   🚨 SIGNIFICANT DIFFERENCE DETECTED!`);
      }
      console.log('');
    });

    // Special check for critical metrics
    console.log('=== CRITICAL METRIC ANALYSIS ===\n');

    if (
      markdownResults.flesch_reading_ease !== plainResults.flesch_reading_ease
    ) {
      console.log(
        '🔴 Flesch Reading Ease differs between markdown and plain text',
      );
    } else {
      console.log('✅ Flesch Reading Ease consistent');
    }

    if (markdownResults.word_count !== plainResults.word_count) {
      console.log(
        '🔴 Word count differs - markdown formatting affecting word counting',
      );
    } else {
      console.log('✅ Word count consistent');
    }

    if (
      JSON.stringify(markdownResults.keywords) !==
      JSON.stringify(plainResults.keywords)
    ) {
      console.log('🔴 Keywords differ - markdown affecting keyword detection');
    } else {
      console.log('✅ Keywords consistent');
    }

    if (markdownResults.precision !== plainResults.precision) {
      console.log(
        '🔴 Precision differs - text comparison affected by formatting',
      );
    } else {
      console.log('✅ Precision consistent');
    }
  } catch (error) {
    console.error('Error testing metrics:', error);
  }
}

testAllMetrics();
