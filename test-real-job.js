/**
 * Create a real job to test metrics in the API
 */

async function createTestJob() {
  console.log('Creating a test job to validate metrics...');

  try {
    const response = await fetch('http://localhost:3000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        prompt:
          'Write a short paragraph about a happy cat playing in the garden.',
        provider: 'test-provider', // Use a test provider to avoid API calls
        model: 'test-model',
        selectedMetrics: [
          { id: 'flesch_reading_ease' },
          { id: 'flesch_kincaid' },
          { id: 'sentiment' },
          { id: 'word_count' },
          { id: 'sentence_count' },
          { id: 'keywords', input: 'cat,garden,happy,playing' },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Request failed:', response.status, response.statusText);
      console.error('Error body:', errorText);
      return;
    }

    const jobResult = await response.json();
    console.log('Job created successfully:', jobResult.id);

    // Wait for job completion
    console.log('Waiting for job completion...');

    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const jobResponse = await fetch(
        `http://localhost:3000/api/jobs/${jobResult.id}`,
      );
      if (!jobResponse.ok) {
        console.error('Failed to fetch job status');
        continue;
      }

      const job = await jobResponse.json();
      console.log(`Attempt ${attempts + 1}: Job status is ${job.status}`);

      if (job.status === 'completed') {
        console.log('\n=== Job Completed ===');
        console.log(
          'Result:',
          job.result?.substring(0, 200) +
            (job.result?.length > 200 ? '...' : ''),
        );

        if (job.metrics) {
          const metrics =
            typeof job.metrics === 'string'
              ? JSON.parse(job.metrics)
              : job.metrics;
          console.log('\n=== Calculated Metrics ===');

          Object.entries(metrics).forEach(([key, value]) => {
            console.log(`${key}:`, value);
          });

          // Check specific metrics
          console.log('\n=== Metrics Validation ===');
          if (
            metrics.flesch_reading_ease !== undefined &&
            metrics.flesch_reading_ease !== 0
          ) {
            console.log(
              '✓ Flesch Reading Ease is working:',
              metrics.flesch_reading_ease,
            );
          } else {
            console.log(
              '✗ Flesch Reading Ease is 0 or missing:',
              metrics.flesch_reading_ease,
            );
          }

          if (metrics.sentiment !== undefined && metrics.sentiment !== 0) {
            console.log('✓ Sentiment is working:', metrics.sentiment);
          } else {
            console.log('✗ Sentiment is 0 or missing:', metrics.sentiment);
          }
        } else {
          console.log('✗ No metrics found in job');
        }

        break;
      } else if (job.status === 'failed') {
        console.log('Job failed:', job.result);
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('Job did not complete within expected time');
    }
  } catch (error) {
    console.error('Error creating test job:', error);
  }
}

createTestJob();
