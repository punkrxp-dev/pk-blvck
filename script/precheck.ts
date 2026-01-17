/**
 * 🔍 PRECHECK UTILITIES - PUNK BLVCK
 *
 * Validação de pré-requisitos para scripts de build e seed
 * Garante que o ambiente está pronto antes da execução
 */

import { access, readFile } from 'fs/promises';
import { log } from '../server/utils/logger';

// Tipos de validação
export type PrecheckResult = {
  success: boolean;
  errors: string[];
  warnings: string[];
};

// Validação de arquivos obrigatórios
export async function validateRequiredFiles(files: string[]): Promise<PrecheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  log(`🔍 Checking ${files.length} required files...`, 'precheck', 'info');

  for (const file of files) {
    try {
      await access(file);
      log(`✅ ${file}`, 'precheck', 'info');
    } catch {
      errors.push(`Required file missing: ${file}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

// Validação de variáveis de ambiente
export async function validateEnvironmentVariables(vars: string[]): Promise<PrecheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  log(`🔍 Checking ${vars.length} environment variables...`, 'precheck', 'info');

  for (const envVar of vars) {
    if (process.env[envVar]) {
      log(`✅ ${envVar}`, 'precheck', 'info');
    } else {
      errors.push(`Required environment variable missing: ${envVar}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

// Validação de Node.js e npm
export async function validateNodeEnvironment(): Promise<PrecheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  log('🔍 Checking Node.js environment...', 'precheck', 'info');

  // Check Node version (minimum 18)
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

  if (majorVersion < 18) {
    errors.push(`Node.js version ${nodeVersion} is too old. Minimum required: 18`);
  } else {
    log(`✅ Node.js ${nodeVersion}`, 'precheck', 'info');
  }

  // Check if package.json exists and is valid
  try {
    const packageJson = await readFile('package.json', 'utf-8');
    const pkg = JSON.parse(packageJson);

    if (!pkg.name || !pkg.version) {
      errors.push('Invalid package.json: missing name or version');
    } else {
      log(`✅ package.json (${pkg.name}@${pkg.version})`, 'precheck', 'info');
    }

    // Check if dependencies are installed
    if (!pkg.dependencies || Object.keys(pkg.dependencies).length === 0) {
      warnings.push('No dependencies found in package.json');
    }

  } catch {
    errors.push('Cannot read or parse package.json');
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

// Validação de banco de dados (para scripts que precisam)
export async function validateDatabaseConnection(): Promise<PrecheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  log('🔍 Checking database connection...', 'precheck', 'info');

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL environment variable is required for database operations');
    return { success: false, errors, warnings };
  }

  // Try to import and test database connection
  try {
    const { db } = await import('../server/db');

    // Simple query to test connection
    await db.execute('SELECT 1 as test');

    log('✅ Database connection successful', 'precheck', 'info');

  } catch (error) {
    errors.push(`Database connection failed: ${error.message}`);
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

// Validação completa para build
export async function validateForBuild(): Promise<PrecheckResult> {
  log('🏗️ Running build prechecks...', 'precheck', 'info');

  const results = await Promise.all([
    validateNodeEnvironment(),
    validateRequiredFiles([
      'package.json',
      'vite.config.ts',
      'tsconfig.json',
      'client/index.html',
    ]),
    validateEnvironmentVariables(['NODE_ENV']),
  ]);

  const combined = results.reduce(
    (acc, result) => ({
      success: acc.success && result.success,
      errors: [...acc.errors, ...result.errors],
      warnings: [...acc.warnings, ...result.warnings],
    }),
    { success: true, errors: [] as string[], warnings: [] as string[] }
  );

  if (combined.success) {
    log('✅ All build prechecks passed', 'precheck', 'info');
  } else {
    log(`❌ Build prechecks failed: ${combined.errors.length} errors`, 'precheck', 'error');
  }

  return combined;
}

// Validação completa para seed
export async function validateForSeed(): Promise<PrecheckResult> {
  log('🌱 Running seed prechecks...', 'precheck', 'info');

  const allowedEnvs = ['development', 'test'];
  const currentEnv = process.env.NODE_ENV;

  if (!currentEnv || !allowedEnvs.includes(currentEnv)) {
    return {
      success: false,
      errors: [`NODE_ENV must be one of: ${allowedEnvs.join(', ')} (current: ${currentEnv})`],
      warnings: [],
    };
  }

  const results = await Promise.all([
    validateNodeEnvironment(),
    validateEnvironmentVariables(['DATABASE_URL', 'NODE_ENV']),
    validateDatabaseConnection(),
  ]);

  const combined = results.reduce(
    (acc, result) => ({
      success: acc.success && result.success,
      errors: [...acc.errors, ...result.errors],
      warnings: [...acc.warnings, ...result.warnings],
    }),
    { success: true, errors: [] as string[], warnings: [] as string[] }
  );

  if (combined.success) {
    log('✅ All seed prechecks passed', 'precheck', 'info');
  } else {
    log(`❌ Seed prechecks failed: ${combined.errors.length} errors`, 'precheck', 'error');
  }

  return combined;
}

// Utility para reportar resultados
export function reportPrecheckResults(result: PrecheckResult, context: string): void {
  if (result.errors.length > 0) {
    log(`❌ ${context} precheck failed:`, 'precheck', 'error');
    result.errors.forEach(error => log(`   ${error}`, 'precheck', 'error'));
  }

  if (result.warnings.length > 0) {
    log(`⚠️  ${context} warnings:`, 'precheck', 'warn');
    result.warnings.forEach(warning => log(`   ${warning}`, 'precheck', 'warn'));
  }

  if (result.success) {
    log(`✅ ${context} precheck passed`, 'precheck', 'info');
  }
}