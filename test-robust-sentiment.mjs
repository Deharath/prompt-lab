#!/usr/bin/env node

/**
 * Test script for robust sentiment analysis with cache handling
 * Tests the improved sentiment service that handles corrupted model cache
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import from the built package
const { analyzeSentiment, clearTransformersCache } = await import('../packages/evaluation-engine/dist/src/lib/sentimentService.js');

console.log('🧪 Testing Robust Sentiment Analysis...\n');

// Test data
const testTexts = [
  'I absolutely love this amazing product! It works perfectly!',
  'This is terrible and completely broken. Worst experience ever.',
  'The weather is okay today.',
  'Mixed feelings about this. Some good, some bad aspects.',
];

async function testSentimentAnalysis() {
  console.log('📝 Testing basic sentiment analysis...');
  
  for (const text of testTexts) {
    try {
      console.log(`\nInput: "${text}"`);
      
      const result = await analyzeSentiment(text, true); // detailed = true
      
      console.log(`✅ Result:`, {
        label: result.label,
        confidence: result.confidence.toFixed(3),
        compound: result.compound.toFixed(3),
        positive: result.positive.toFixed(3),
        negative: result.negative.toFixed(3),
        neutral: result.neutral.toFixed(3),
        mode: result.mode
      });
      
    } catch (error) {
      console.error(`❌ Error analyzing "${text}":`, error.message);
    }
  }
}

async function testCacheClearing() {
  console.log('\n🧹 Testing cache clearing functionality...');
  
  try {
    await clearTransformersCache();
    console.log('✅ Cache clearing completed successfully');
  } catch (error) {
    console.error('❌ Cache clearing failed:', error.message);
  }
}

async function runTests() {
  try {
    await testSentimentAnalysis();
    await testCacheClearing();
    
    console.log('\n🎉 All sentiment analysis tests completed!');
    console.log('\nIf you encountered cache corruption issues:');
    console.log('1. The system should automatically detect and clear corrupted cache');
    console.log('2. Model will be re-downloaded on next request');
    console.log('3. No fallback to inferior sentiment methods');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  }
}

runTests();
