#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

type Case = {
  email: string;
  message?: string;
  source: string;
  expected_intent: "high" | "medium" | "low" | "spam";
};

function validateCase(caseData: any, index: number): string[] {
  const errors: string[] = [];

  // Required fields
  if (!caseData.email) errors.push(`Case ${index}: Missing email`);
  if (!caseData.source) errors.push(`Case ${index}: Missing source`);
  if (!caseData.expected_intent) errors.push(`Case ${index}: Missing expected_intent`);

  // Email validation
  if (caseData.email && !caseData.email.includes('@')) {
    errors.push(`Case ${index}: Invalid email format: ${caseData.email}`);
  }

  // Expected intent validation
  const validIntents = ["high", "medium", "low", "spam"];
  if (caseData.expected_intent && !validIntents.includes(caseData.expected_intent)) {
    errors.push(`Case ${index}: Invalid expected_intent: ${caseData.expected_intent}. Must be one of: ${validIntents.join(', ')}`);
  }

  // Source validation
  if (caseData.source && typeof caseData.source !== 'string') {
    errors.push(`Case ${index}: Source must be a string`);
  }

  return errors;
}

function validateDataset(filePath: string): boolean {
  console.log(`🔍 Validating dataset: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  console.log(`📊 Found ${lines.length} cases to validate`);

  let totalErrors = 0;
  const intentCounts = { high: 0, medium: 0, low: 0, spam: 0 };

  lines.forEach((line, index) => {
    try {
      const caseData: Case = JSON.parse(line);
      const errors = validateCase(caseData, index + 1);

      if (errors.length > 0) {
        errors.forEach(error => console.error(`❌ ${error}`));
        totalErrors += errors.length;
      }

      // Count intents
      if (caseData.expected_intent) {
        intentCounts[caseData.expected_intent]++;
      }
    } catch (e) {
      console.error(`❌ Case ${index + 1}: Invalid JSON - ${e}`);
      totalErrors++;
    }
  });

  console.log('\n📈 Intent Distribution:');
  Object.entries(intentCounts).forEach(([intent, count]) => {
    console.log(`  ${intent}: ${count} cases`);
  });

  if (totalErrors === 0) {
    console.log('✅ Dataset validation passed!');
    return true;
  } else {
    console.error(`❌ Dataset validation failed: ${totalErrors} errors found`);
    return false;
  }
}

function main() {
  const datasetPath = process.argv[2] || 'datasets/dataset.jsonl';

  // Try relative to bench directory
  const fullPath = path.isAbsolute(datasetPath)
    ? datasetPath
    : path.join(process.cwd(), 'bench', datasetPath);

  const isValid = validateDataset(fullPath);
  process.exit(isValid ? 0 : 1);
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}