// Test direct sentiment API call
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000'; // API runs on 3000

// Test the metrics computation for a simple job with sentiment
async function testSentimentFix() {
  console.log('=== Testing sentiment fix ===\n');

  const testJobs = [
    {
      name: 'Neutral Test (should be neutral)',
      prompt: 'Summarize: {{input}}',
      inputData: 'Technical report on database performance',
      output:
        'This is a technical document about database performance metrics. It contains factual information about system performance. The report covers various aspects of database optimization.',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      metrics: ['sentiment', 'sentiment_detailed'],
    },
    {
      name: 'Positive Test (should be positive)',
      prompt: 'Review: {{input}}',
      inputData: 'Amazing laptop',
      output:
        'This laptop is absolutely amazing! I love it so much! Best purchase ever made! Incredible performance and fantastic quality!',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      metrics: ['sentiment', 'sentiment_detailed'],
    },
    {
      name: 'Negative Test (should be negative)',
      prompt: 'Review: {{input}}',
      inputData: 'Terrible product',
      output:
        'This product is absolutely terrible! I hate it completely! Worst purchase ever! Horrible quality and awful performance!',
      provider: 'openai',
      model: 'gpt-4.1-mini',
      metrics: ['sentiment', 'sentiment_detailed'],
    },
  ];

  for (const testJob of testJobs) {
    console.log(`--- ${testJob.name} ---`);
    console.log(`Output: "${testJob.output}"`);

    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testJob),
      });

      if (!response.ok) {
        console.error(
          '❌ Jobs API Error:',
          response.status,
          response.statusText,
        );
        continue;
      }

      const result = await response.json();
      console.log('✓ Job Created with ID:', result.id);

      // Wait a moment for processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Fetch the job details to see the computed metrics
      const jobResponse = await fetch(`${API_BASE}/jobs/${result.id}`);
      if (jobResponse.ok) {
        const jobDetails = await jobResponse.json();

        if (jobDetails.metrics) {
          console.log('\n📊 Sentiment Results:');
          Object.entries(jobDetails.metrics).forEach(([key, value]) => {
            if (key.includes('sentiment')) {
              console.log(`   ${key}:`, JSON.stringify(value, null, 2));

              // Check what the frontend would display
              if (typeof value === 'object' && value !== null) {
                if ('label' in value && 'confidence' in value) {
                  const label = value.label;
                  const confidence = value.confidence;
                  const positive = value.positive || 0;
                  const negative = value.negative || 0;
                  const neutral = value.neutral || 0;

                  const displayValue = `${label.charAt(0).toUpperCase()}${label.slice(1)} (${(confidence * 100).toFixed(1)}%)`;
                  console.log(`   -> Frontend shows: "${displayValue}"`);
                  console.log(
                    `   -> Distribution: Pos: ${(positive * 100).toFixed(1)}%, Neg: ${(negative * 100).toFixed(1)}%, Neu: ${(neutral * 100).toFixed(1)}%`,
                  );

                  // Check if the prediction makes sense
                  const maxScore = Math.max(positive, negative, neutral);
                  let expectedLabel = 'neutral';
                  if (maxScore === positive) expectedLabel = 'positive';
                  else if (maxScore === negative) expectedLabel = 'negative';

                  const correct = label === expectedLabel;
                  console.log(
                    `   -> ${correct ? '✅' : '❌'} Label matches highest score (expected: ${expectedLabel})`,
                  );
                }
              }
            }
          });
        } else {
          console.log('❌ No metrics found in job details');
        }
      } else {
        console.error(
          '❌ Failed to fetch job details:',
          jobResponse.status,
          jobResponse.statusText,
        );
      }
    } catch (error) {
      console.error('❌ Network Error:', error.message);
    }

    console.log('─'.repeat(80));
  }
}

testSentimentFix();
