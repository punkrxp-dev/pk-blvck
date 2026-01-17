/**
 * 🔍 ROUTES VERIFICATION - PUNK BLVCK
 *
 * Verifica se todas as rotas estão definidas no código fonte
 * Análise estática sem inicializar servidor
 */

// Set environment variables before any imports
process.env.DATABASE_URL = 'postgresql://mock:mock@localhost:5432/mock';
process.env.NODE_ENV = 'test';

import fs from 'fs';
import path from 'path';

// Lista completa das rotas esperadas baseada no código fonte
const EXPECTED_ROUTES = [
  // Authentication
  { method: 'POST', path: '/api/auth/register', description: 'User registration' },
  { method: 'POST', path: '/api/auth/login', description: 'User login' },
  { method: 'POST', path: '/api/auth/logout', description: 'User logout' },
  { method: 'GET', path: '/api/auth/me', description: 'Get current user' },

  // Users
  { method: 'GET', path: '/api/users', description: 'List users' },

  // MCP (Main API)
  { method: 'POST', path: '/api/mcp/ingest', description: 'Process lead with AI' },
  { method: 'GET', path: '/api/mcp/health', description: 'Health check' },
  { method: 'GET', path: '/api/mcp/leads', description: 'Get leads' },
  { method: 'PATCH', path: '/api/mcp/leads/:id/status', description: 'Update lead status' },
  { method: 'PATCH', path: '/api/mcp/leads/:id/mark-spam', description: 'Mark lead as spam' },
  { method: 'POST', path: '/api/mcp/leads/:id/notify', description: 'Send notification' },
  { method: 'DELETE', path: '/api/mcp/leads/:id', description: 'Delete lead' },
];

function verifyRoutes(): void {
  console.log('🔍 Starting static route verification...');

  try {
    // Read routes.ts file
    const routesPath = path.join(process.cwd(), 'server', 'routes.ts');
    const routesContent = fs.readFileSync(routesPath, 'utf-8');

    // Extract route definitions using regex
    const routeRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    const foundRoutes: Array<{ method: string; path: string }> = [];

    let match;
    while ((match = routeRegex.exec(routesContent)) !== null) {
      foundRoutes.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }

    console.log(`📊 Found ${foundRoutes.length} route definitions in source code`);

    // Verify expected routes
    const missingRoutes: typeof EXPECTED_ROUTES = [];
    const extraRoutes: typeof foundRoutes = [];

    // Check expected routes
    for (const expected of EXPECTED_ROUTES) {
      const found = foundRoutes.find(r =>
        r.method === expected.method && r.path === expected.path
      );

      if (!found) {
        missingRoutes.push(expected);
      }
    }

    // Check for unexpected routes
    for (const route of foundRoutes) {
      const found = EXPECTED_ROUTES.find(r =>
        r.method === route.method && r.path === route.path
      );

      if (!found) {
        extraRoutes.push(route);
      }
    }

    // Check Vercel API handler
    const apiHandlerPath = path.join(process.cwd(), 'api', 'index.js');
    const apiHandlerContent = fs.readFileSync(apiHandlerPath, 'utf-8');

    const hasRegisterRoutes = apiHandlerContent.includes('registerRoutes');
    const hasErrorHandling = apiHandlerContent.includes('try') && apiHandlerContent.includes('catch');
    const hasServerReuse = apiHandlerContent.includes('let server');

    // Report results
    console.log('\n📋 VERIFICATION RESULTS');
    console.log('='.repeat(60));

    console.log('🔍 Source Code Analysis:');
    if (missingRoutes.length === 0) {
      console.log('✅ All expected routes are defined in source code!');
    } else {
      console.log(`❌ ${missingRoutes.length} expected routes are missing from source:`);
      missingRoutes.forEach(route => {
        console.log(`   ${route.method} ${route.path} - ${route.description}`);
      });
    }

    if (extraRoutes.length === 0) {
      console.log('✅ No unexpected routes found in source');
    } else {
      console.log(`⚠️  ${extraRoutes.length} unexpected routes found in source:`);
      extraRoutes.forEach(route => {
        console.log(`   ${route.method} ${route.path}`);
      });
    }

    console.log('\n🚀 Vercel API Handler Analysis:');
    console.log(`✅ Handler exists: ${fs.existsSync(apiHandlerPath) ? 'Yes' : 'No'}`);
    console.log(`✅ Imports registerRoutes: ${hasRegisterRoutes ? 'Yes' : 'No'}`);
    console.log(`✅ Has error handling: ${hasErrorHandling ? 'Yes' : 'No'}`);
    console.log(`✅ Server reuse pattern: ${hasServerReuse ? 'Yes' : 'No'}`);

    console.log('\n📊 ROUTE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Routes in source: ${foundRoutes.length}`);
    console.log(`Expected routes: ${EXPECTED_ROUTES.length}`);
    console.log(`Missing routes: ${missingRoutes.length}`);
    console.log(`Extra routes: ${extraRoutes.length}`);

    console.log('\n🔗 ALL ROUTES IN SOURCE CODE');
    console.log('='.repeat(60));
    foundRoutes
      .sort((a, b) => a.path.localeCompare(b.path))
      .forEach(route => {
        const expected = EXPECTED_ROUTES.find(r => r.method === route.method && r.path === route.path);
        const status = expected ? '✅' : '❓';
        console.log(`${status} ${route.method.padEnd(6)} ${route.path}`);
      });

    // Final assessment
    console.log('\n🎯 VERDICT');
    console.log('='.repeat(60));

    const sourceRoutesOk = missingRoutes.length === 0;
    const vercelHandlerOk = hasRegisterRoutes && hasErrorHandling && hasServerReuse;

    if (sourceRoutesOk && vercelHandlerOk) {
      console.log('🎉 EXCELLENT! All APIs are properly configured for Vercel Functions');
      console.log('   ✅ Routes correctly defined in source code');
      console.log('   ✅ Vercel handler properly configured');
      console.log('   ✅ Error handling implemented');
      console.log('   ✅ Server reuse pattern for performance');
      process.exit(0);
    } else {
      console.log('❌ ISSUES FOUND:');
      if (!sourceRoutesOk) {
        console.log('   - Some expected routes are missing from source code');
      }
      if (!vercelHandlerOk) {
        console.log('   - Vercel API handler has configuration issues');
      }
      console.log('   Vercel Functions may not work correctly');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Route verification failed:', error);
    process.exit(1);
  }
}

// Run verification
verifyRoutes();