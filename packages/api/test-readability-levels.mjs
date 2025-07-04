/**
 * Test readability with simple vs complex text to verify the scores make sense
 */
import { calculateReadabilityScores } from './dist/src/lib/readabilityService.js';

const verySimpleText = "The cat is happy. The dog is running. This is easy to read.";
const complexText = "Recent developments in artificial intelligence technology and their implications for various industries. The progress in AI brings significant benefits, but it also poses challenges that need to be addressed.";
const ourJobText = `Recent developments in artificial intelligence technology and their implications for various industries. Rapid Advancement: AI technology is evolving quickly, impacting numerous sectors. Opportunities and Challenges: The progress in AI brings significant benefits, but it also poses challenges that need to be addressed. Focus on Reliability: Researchers are prioritizing the development of AI systems that are reliable and can be trusted by users. The rapid development of artificial intelligence presents a dual-edged sword; while it offers substantial opportunities for innovation and efficiency across various industries.`;

console.log('🔍 Testing readability with different text complexities...\n');

async function testReadabilityLevels() {
  try {
    const simpleScores = await calculateReadabilityScores(verySimpleText);
    const complexScores = await calculateReadabilityScores(complexText);
    const jobScores = await calculateReadabilityScores(ourJobText);
    
    console.log('📚 READABILITY COMPARISON:\n');
    
    console.log('🟢 Very Simple Text ("The cat is happy...")');
    console.log(`   Text: "${verySimpleText}"`);
    console.log(`   Flesch Reading Ease: ${simpleScores.fleschReadingEase} (Should be 80-100)`);
    console.log(`   Flesch-Kincaid: ${simpleScores.fleschKincaid} (Should be low)`);
    console.log('');
    
    console.log('🟡 Complex Text (AI article excerpt)');
    console.log(`   Text: "${complexText.substring(0, 100)}..."`);
    console.log(`   Flesch Reading Ease: ${complexScores.fleschReadingEase} (Should be 30-50)`);
    console.log(`   Flesch-Kincaid: ${complexScores.fleschKincaid}`);
    console.log('');
    
    console.log('🔴 Our Job Text (cleaned from markdown)');
    console.log(`   Text: "${ourJobText.substring(0, 100)}..."`);
    console.log(`   Flesch Reading Ease: ${jobScores.fleschReadingEase} (Currently getting 2.04)`);
    console.log(`   Flesch-Kincaid: ${jobScores.fleschKincaid}`);
    console.log('');
    
    // Analysis
    console.log('=== ANALYSIS ===\n');
    
    if (simpleScores.fleschReadingEase < 60) {
      console.log('🚨 PROBLEM: Simple text should have high readability (80+), but got', simpleScores.fleschReadingEase);
    } else {
      console.log('✅ Simple text readability looks correct:', simpleScores.fleschReadingEase);
    }
    
    if (jobScores.fleschReadingEase < 10) {
      console.log('🤔 Job text is extremely difficult to read (0-10 range). This might be correct for technical content, but let\'s verify...');
      
      // Test with text-readability-ts directly for comparison
      console.log('\n🔧 DIRECT LIBRARY TEST:');
      const textReadabilityModule = await import('text-readability-ts');
      const readability = textReadabilityModule.default;
      
      const directSimple = readability.fleschReadingEase(verySimpleText);
      const directComplex = readability.fleschReadingEase(complexText);
      
      console.log(`Direct simple text: ${directSimple}`);
      console.log(`Direct complex text: ${directComplex}`);
      
      if (directSimple > 60 && directComplex < 50) {
        console.log('✅ Library is working correctly - our job text is legitimately very complex');
      } else {
        console.log('❌ Library might have issues');
      }
    }
    
  } catch (error) {
    console.error('Error testing readability levels:', error);
  }
}

testReadabilityLevels();
