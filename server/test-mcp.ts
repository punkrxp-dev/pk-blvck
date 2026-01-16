#!/usr/bin/env tsx
/**
 * MCP Test Script
 *
 * Tests the Heavy Metal Flow (NΞØ Protocol) end-to-end using the new architecture.
 */

import 'dotenv/config';
import { processLeadPipeline } from './ai/mcp/pipeline';

async function testMCP() {
  console.log('🎸 ═══════════════════════════════════════════════════════');
  console.log('🎸 MCP PIPELINE TEST - NΞØ Protocol');
  console.log('🎸 ═══════════════════════════════════════════════════════\n');

  // Test cases
  const testCases = [
    {
      name: 'High Intent Lead',
      input: {
        email: 'ceo@techstartup.com',
        message: 'I want to buy your product. Can you send me pricing for 100 licenses?',
        source: 'website-contact-form',
      },
    },
    {
      name: 'Medium Intent Lead',
      input: {
        email: 'john@company.com',
        message: 'Interested in learning more about your services',
        source: 'landing-page',
      },
    },
    {
      name: 'Low Intent Lead',
      input: {
        email: 'user@example.com',
        message: 'Just browsing',
        source: 'blog',
      },
    },
    {
      name: 'Rescued Lead (Neo Mode)',
      input: {
        email: 'invalid.user@fake-domain.xyz', // Unverified email
        message: 'Gostaria de saber o preço do plano e como funciona para agendar uma demo',
        source: 'chat-widget',
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 TEST CASE: ${testCase.name}`);
    console.log('─'.repeat(60));

    try {
      const result = await processLeadPipeline(testCase.input);

      console.log('\n✅ TEST PASSED');
      console.log(`   Lead ID: ${result.id}`);
      console.log(`   Intent: ${result.intent.intent.toUpperCase()}`);
      console.log(`   Confidence: ${Math.round(result.intent.confidence * 100)}%`);
      console.log(`   Model: ${result.processing.actualModel}`);
      console.log(`   Processing Time: ${result.processing.processingTimeMs}ms`);
      console.log('');
    } catch (error) {
      console.error('\n❌ TEST FAILED');
      console.error(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('');
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🎸 ═══════════════════════════════════════════════════════');
  console.log('🎸 ALL TESTS COMPLETED');
  console.log('🎸 ═══════════════════════════════════════════════════════\n');
}

// Run tests
testMCP().catch(console.error);
