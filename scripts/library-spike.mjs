#!/usr/bin/env node

/**
 * Task 0 - Library Spike & Cold-Start Timing
 * Tests each library loads under Node 18 and logs cold-start times
 */

import { performance } from 'node:perf_hooks';

console.log('🔬 Starting Library Spike Test...\n');

// Test text-readability-ts
console.log('📚 Testing text-readability-ts...');
const readabilityStart = performance.now();
try {
  const readability = await import('text-readability-ts');
  const readabilityInstance = readability.default; // Use the default export
  const readabilityEnd = performance.now();

  const sampleText =
    'The quick brown fox jumps over the lazy dog. This is a simple test.';
  const freScore = readabilityInstance.fleschReadingEase(sampleText);

  console.log(
    `✅ text-readability-ts loaded in ${(readabilityEnd - readabilityStart).toFixed(2)}ms`,
  );
  console.log(`   FRE Score: ${freScore.toFixed(2)}`);
} catch (error) {
  console.log(`❌ text-readability-ts failed: ${error.message}`);
}

// Test vader-sentiment
console.log('\n😊 Testing vader-sentiment...');
const vaderStart = performance.now();
try {
  const vader = await import('vader-sentiment');
  const vaderEnd = performance.now();

  const sampleText = 'I love this amazing product!';
  const scores = vader.SentimentIntensityAnalyzer.polarity_scores(sampleText);

  console.log(
    `✅ vader-sentiment loaded in ${(vaderEnd - vaderStart).toFixed(2)}ms`,
  );
  console.log(`   VADER scores: ${JSON.stringify(scores)}`);
} catch (error) {
  console.log(`❌ vader-sentiment failed: ${error.message}`);
}

// Test wink-tokenizer
console.log('\n🔤 Testing wink-tokenizer...');
const tokenStart = performance.now();
try {
  const tokenizer = (await import('wink-tokenizer')).default();
  const tokenEnd = performance.now();

  const sampleText = 'Hello, world! This is a test.';
  const tokens = tokenizer.tokenize(sampleText);

  console.log(
    `✅ wink-tokenizer loaded in ${(tokenEnd - tokenStart).toFixed(2)}ms`,
  );
  console.log(`   Tokens: ${tokens.map((t) => t.value).join(' | ')}`);
} catch (error) {
  console.log(`❌ wink-tokenizer failed: ${error.message}`);
}

// Test @xenova/transformers (more complex)
console.log('\n🤖 Testing @xenova/transformers...');
const transformersStart = performance.now();
try {
  const { pipeline } = await import('@xenova/transformers');
  const classifier = await pipeline(
    'sentiment-analysis',
    'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
  );
  const transformersEnd = performance.now();

  const testText = 'I love this amazing product!';
  const result = await classifier(testText);

  console.log(
    `✅ @xenova/transformers loaded in ${(transformersEnd - transformersStart).toFixed(2)}ms`,
  );
  console.log(`   Sentiment result: ${JSON.stringify(result)}`);
} catch (error) {
  console.log(`❌ @xenova/transformers failed: ${error.message}`);
  console.log(
    `   This may require additional setup or environment configuration`,
  );
}

console.log('\n🎉 Library spike test complete!');
