// Simple test script to verify Gemini integration
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

async function testGemini() {
  try {
    console.log('🚀 Testing Gemini integration...');
    
    // 1. Create a job
    console.log('📝 Creating a job with Gemini...');
    const createResponse = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Write a short haiku about AI',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Job creation failed: ${createResponse.status} ${error}`);
    }

    const job = await createResponse.json();
    console.log('✅ Job created:', {
      id: job.id,
      provider: job.provider,
      model: job.model,
      status: job.status,
    });

    // 2. Stream the job
    console.log('🔄 Streaming job completion...');
    const streamResponse = await fetch(`${API_BASE}/jobs/${job.id}/stream`);
    
    if (!streamResponse.ok) {
      throw new Error(`Streaming failed: ${streamResponse.status}`);
    }

    console.log('📡 Streaming response:');
    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      console.log(chunk);
    }

    console.log('✅ Gemini integration test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing Gemini:', error.message);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testGemini();
}
