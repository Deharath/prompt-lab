// Debug sentiment handling in frontend
console.log('Testing sentiment handling logic...');

// Simulate sentiment objects from backend
const testSentiments = [
  // RoBERTa positive
  {
    compound: 0.8,
    positive: 0.8,
    negative: 0.1,
    neutral: 0.1,
    label: 'positive',
    confidence: 0.8,
    mode: 'accurate',
  },
  // RoBERTa negative
  {
    compound: -0.7,
    positive: 0.1,
    negative: 0.7,
    neutral: 0.2,
    label: 'negative',
    confidence: 0.7,
    mode: 'accurate',
  },
  // RoBERTa neutral
  {
    compound: 0.1,
    positive: 0.2,
    negative: 0.2,
    neutral: 0.6,
    label: 'neutral',
    confidence: 0.6,
    mode: 'accurate',
  },
  // VADER positive
  {
    compound: 0.5,
    positive: 0.7,
    negative: 0.1,
    neutral: 0.2,
    label: 'positive',
    confidence: 0.7,
    mode: 'fast',
  },
];

// Test the frontend logic
function testSentimentFormatting(value) {
  console.log('\n--- Testing value:', value);

  let formattedValue = value;
  let unit = '';

  // Simulate the exact logic from the frontend
  let sentimentObj = null;

  if (typeof value === 'object' && value !== null) {
    sentimentObj = value;
  } else if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        sentimentObj = parsed;
      }
    } catch {
      // If parsing fails, treat as plain string
    }
  }

  if (sentimentObj && 'label' in sentimentObj && 'confidence' in sentimentObj) {
    const label = sentimentObj.label;
    const confidence = sentimentObj.confidence;
    formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)} (${(confidence * 100).toFixed(1)}%)`;
    unit = '';
    console.log('✓ Matched label/confidence pattern:', formattedValue);
  } else if (sentimentObj && 'compound' in sentimentObj) {
    const compound = sentimentObj.compound;
    const label =
      compound > 0.1 ? 'positive' : compound < -0.1 ? 'negative' : 'neutral';
    formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
    unit = '';
    console.log('✓ Matched compound pattern:', formattedValue);
  } else if (typeof value === 'number') {
    const label =
      value > 0.1 ? 'positive' : value < -0.1 ? 'negative' : 'neutral';
    formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
    unit = '';
    console.log('✓ Matched numeric pattern:', formattedValue);
  } else {
    formattedValue = typeof value === 'string' ? value : String(value);
    unit = '';
    console.log('✗ Fallback pattern:', formattedValue);
  }

  return { formattedValue, unit };
}

// Test all cases
testSentiments.forEach((sentiment) => {
  testSentimentFormatting(sentiment);
  testSentimentFormatting(JSON.stringify(sentiment)); // Test stringified version
});

// Test edge cases
console.log('\n=== Testing edge cases ===');
testSentimentFormatting(0.5); // Number
testSentimentFormatting(-0.5); // Negative number
testSentimentFormatting('positive'); // String
testSentimentFormatting('{"invalid": "object"}'); // Invalid object
