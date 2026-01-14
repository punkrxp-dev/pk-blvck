#!/usr/bin/env tsx
/**
 * AI Configuration Test Script
 *
 * This script validates that the AI infrastructure is properly configured.
 * Run with: tsx server/test-ai-config.ts
 */

// Carregar variáveis de ambiente do .env
import 'dotenv/config';

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

    // Test model selection (use Google AI since OpenAI quota is exceeded)
    console.log('🎯 Testing Model Selection...');
    try {
        // Use Google AI directly (OpenAI has quota issues)
        const model = selectModel(false); // use fallback (Google)
        const modelName = 'Google Gemini 2.0 Flash';
        console.log('✅ Model selected: Google Gemini 2.0 Flash (OpenAI quota exceeded)\n');

        // Test simple generation
        console.log('🧪 Testing AI Generation...');
        console.log(`Model: ${modelName}`);
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
