/**
 * Quick test script to validate metrics are working correctly
 */

const testText =
  "The quick brown fox jumps over the lazy dog. This is a simple sentence to test readability metrics. The weather is nice today and I feel happy about the progress we've made.";

async function testMetrics() {
  console.log('Testing metrics with sample text...');
  console.log('Text:', testText);
  console.log('Text length:', testText.length, 'characters');

  try {
    const response = await fetch('http://localhost:3000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test prompt for metrics validation',
        provider: 'openai',
        model: 'gpt-4o-mini',
        selectedMetrics: [
          { id: 'flesch_reading_ease' },
          { id: 'flesch_kincaid' },
          { id: 'sentiment' },
          { id: 'word_count' },
          { id: 'sentence_count' },
          { id: 'keywords', input: 'fox,dog,weather,happy' },
          { id: 'vocab_diversity' },
          {
            id: 'precision',
            input:
              'The brown fox jumped over the lazy dog and felt happy about the nice weather today.',
          },
        ],
        // Simulate the response text for metrics calculation
        result: testText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Request failed:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('\n=== Job Creation Result ===');
    console.log('Job ID:', result.id);
    console.log('Status:', result.status);

    // Wait a moment then fetch the job to see metrics
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const jobResponse = await fetch(
      `http://localhost:3000/api/jobs/${result.id}`,
    );
    if (!jobResponse.ok) {
      console.error('Failed to fetch job:', jobResponse.status);
      return;
    }

    const job = await jobResponse.json();
    console.log('\n=== Calculated Metrics ===');
    console.log('Job status:', job.status);

    if (job.metrics) {
      const metrics =
        typeof job.metrics === 'string' ? JSON.parse(job.metrics) : job.metrics;
      console.log('\nMetrics calculated:');

      Object.entries(metrics).forEach(([key, value]) => {
        console.log(`- ${key}:`, value);
      });

      // Validate key metrics
      console.log('\n=== Validation ===');

      if (metrics.flesch_reading_ease !== undefined) {
        console.log(
          '✓ Flesch Reading Ease calculated:',
          metrics.flesch_reading_ease,
        );
      } else {
        console.log('✗ Flesch Reading Ease missing');
      }

      if (metrics.sentiment !== undefined) {
        console.log('✓ Sentiment calculated:', metrics.sentiment);
      } else {
        console.log('✗ Sentiment missing');
      }

      if (metrics.word_count !== undefined) {
        console.log('✓ Word count calculated:', metrics.word_count);
      } else {
        console.log('✗ Word count missing');
      }

      if (metrics.keywords !== undefined) {
        console.log('✓ Keywords calculated:', metrics.keywords);
      } else {
        console.log('✗ Keywords missing');
      }

      if (metrics.precision !== undefined) {
        console.log('✓ Precision calculated:', metrics.precision);
      } else {
        console.log('✗ Precision missing');
      }
    } else {
      console.log('No metrics found in job result');
    }
  } catch (error) {
    console.error('Error testing metrics:', error);
  }
}

testMetrics();
