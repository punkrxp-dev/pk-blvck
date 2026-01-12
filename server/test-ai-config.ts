#!/usr/bin/env tsx
/**
 * AI Configuration Test Script
 * 
 * This script validates that the AI infrastructure is properly configured.
 * Run with: tsx server/test-ai-config.ts
 */

import { checkAIConfig, selectModel } from './ai';
import { generateText } from 'ai';

async function testAIConfiguration() {
    console.log('🤖 Testing AI Configuration...\n');

    // Check configuration
    const config = checkAIConfig();

    console.log('📋 Configuration Status:');
    console.log(`  OpenAI API Key: ${config.openai ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  Google API Key: ${config.google ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  Has Any Model: ${config.hasAnyModel ? '✅ Yes' : '❌ No'}\n`);

    if (!config.hasAnyModel) {
        console.error('❌ ERROR: No API keys configured!');
        console.log('\n📝 To fix this:');
        console.log('1. Copy .env.example to .env');
        console.log('2. Add your API keys:');
        console.log('   OPENAI_API_KEY=sk-proj-...');
        console.log('   GOOGLE_API_KEY=...');
        process.exit(1);
    }

    // Test model selection
    console.log('🎯 Testing Model Selection...');
    try {
        const model = selectModel();
        console.log('✅ Model selected successfully\n');

        // Test simple generation
        console.log('🧪 Testing AI Generation...');
        console.log('Prompt: "Say hello in Portuguese"\n');

        const result = await generateText({
            model,
            prompt: 'Say hello in Portuguese in a friendly way',
        });

        console.log('📝 Response:');
        console.log(`  ${result.text}\n`);

        console.log('✅ AI Generation Test PASSED!\n');
        console.log('🎉 All tests passed! AI infrastructure is ready.');

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run tests
testAIConfiguration().catch(console.error);
