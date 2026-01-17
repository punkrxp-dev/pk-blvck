import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import { rm, readFile, writeFile } from 'fs/promises';
import { log } from '../server/utils/logger';
import { validateForBuild, reportPrecheckResults } from './precheck';

// server deps to bundle - ULTRA-MINIMAL allowlist for optimal cold start
// Only bundle the absolute minimum required for server startup
const allowlist = [
  // Only the most essential packages that benefit from bundling
  'express',                // Core framework - keep bundled for startup speed
  'zod',                   // Schema validation - core to the app
  'cors',                  // Essential middleware - very small
];

// Environment validation using precheck utilities
async function validateEnvironment(): Promise<void> {
  const result = await validateForBuild();
  reportPrecheckResults(result, 'Build');

  if (!result.success) {
    const errorMessage = `Build prechecks failed: ${result.errors.join(', ')}`;
    throw new Error(errorMessage);
  }
}

async function updateSEOFiles(): Promise<void> {
  log('🔄 Updating SEO files...', 'build', 'info');

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new Error(`Invalid date format generated: ${today}`);
  }

  // Update sitemap.xml
  const sitemapPath = 'client/public/sitemap.xml';
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://punkblvck.com.br/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  try {
    await writeFile(sitemapPath, sitemapContent, 'utf-8');
    log(`✅ Sitemap updated: ${sitemapPath} (lastmod: ${today})`, 'build', 'info');
  } catch (error) {
    log(`❌ Failed to update sitemap.xml: ${error.message}`, 'build', 'error');
    throw error;
  }
}

async function buildAll(): Promise<void> {
  const startTime = Date.now();

  try {
    log('🏗️ Starting production build process...', 'build', 'info');

    // Clean dist directory with validation
    try {
      await rm('dist', { recursive: true, force: true });
      log('🧹 Cleaned dist directory', 'build', 'info');
    } catch (error) {
      log(`⚠️ Could not clean dist directory: ${error.message}`, 'build', 'warn');
    }

    // Update SEO files before building
    await updateSEOFiles();

    // Build client
    log('🏗️ Building client (Vite)...', 'build', 'info');
    const clientStartTime = Date.now();

    await viteBuild();

    const clientBuildTime = Date.now() - clientStartTime;
    log(`✅ Client build completed in ${clientBuildTime}ms`, 'build', 'info');

    // Build server
    log('🏗️ Building server (esbuild)...', 'build', 'info');
    const serverStartTime = Date.now();

    // Validate package.json
    let pkg: any;
    try {
      const packageJson = await readFile('package.json', 'utf-8');
      pkg = JSON.parse(packageJson);
    } catch (error) {
      throw new Error(`Failed to read/parse package.json: ${error.message}`);
    }

    const allDeps = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];

    if (allDeps.length === 0) {
      log('⚠️ No dependencies found in package.json', 'build', 'warn');
    }

    const externals = allDeps.filter(dep => !allowlist.includes(dep));
    const bundled = allDeps.filter(dep => allowlist.includes(dep));

    log(`📦 Bundling ${bundled.length} dependencies: ${bundled.join(', ')}`, 'build', 'info');
    log(`📦 Externalizing ${externals.length} dependencies: ${externals.join(', ')}`, 'build', 'info');

    await esbuild({
      entryPoints: ['server/index.ts'],
      platform: 'node',
      bundle: true,
      format: 'cjs',
      outfile: 'dist/index.cjs',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      minify: true,
      external: externals,
      logLevel: 'info',

      // Aggressive optimizations for minimal bundle size
      treeShaking: true,
      ignoreAnnotations: true,
      legalComments: 'none',
      sourcemap: false,
      metafile: true,

      // Minification options
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,

      // Remove unused code
      pure: ['console.log', 'console.debug'], // Remove debug logs in production

      // Additional security and performance options
      banner: {
        js: '// PUNK BLVCK Production Build\n',
      },
      footer: {
        js: '\n// Success\n',
      },
    });

    // Analyze bundle size from the file we just created
    try {
      const fs = await import('fs/promises');
      const stats = await fs.stat('dist/index.cjs');
      const bundleSize = stats.size;
      const bundleSizeMB = (bundleSize / 1024 / 1024).toFixed(2);

      log(`📊 Bundle analysis: ${bundleSizeMB}MB`, 'build', 'info');
      log(`   📦 Bundled dependencies: ${bundled.length}`, 'build', 'info');
      log(`   📦 External dependencies: ${externals.length}`, 'build', 'info');

      if (bundleSize > 1000 * 1024) { // > 1MB - too large
        log('🚨 Bundle size is too large (>1MB)', 'build', 'error');
        log('💡 Critical optimizations needed:', 'build', 'error');
        log('   1. Externalize heavy dependencies (AI SDKs, UI libraries)', 'build', 'error');
        log('   2. Remove unused imports from server code', 'build', 'error');
        log('   3. Consider dynamic imports for large features', 'build', 'error');
        log('   4. Review server/index.ts for unnecessary imports', 'build', 'error');
      } else if (bundleSize > 500 * 1024) { // > 500KB - acceptable but could be better
        log(`⚠️ Bundle size is moderate: ${bundleSizeMB}MB`, 'build', 'warn');
        log('💡 Consider further optimizations for better performance', 'build', 'warn');
      } else {
        log(`✅ Bundle size optimized: ${bundleSizeMB}MB`, 'build', 'info');
        log('🎉 Excellent! Bundle size is well-optimized for production', 'build', 'info');
      }
    } catch (error) {
      log(`⚠️ Could not analyze bundle size: ${error.message}`, 'build', 'warn');
    }

    const serverBuildTime = Date.now() - serverStartTime;
    log(`✅ Server build completed in ${serverBuildTime}ms`, 'build', 'info');

    const totalTime = Date.now() - startTime;
    log(`🎉 Build completed successfully in ${totalTime}ms (client: ${clientBuildTime}ms, server: ${serverBuildTime}ms)`, 'build', 'info');

  } catch (error) {
    const totalTime = Date.now() - startTime;
    log(`💥 Build failed after ${totalTime}ms: ${error.message}`, 'build', 'error');
    throw error;
  }
}

// Main execution with proper error handling and environment validation
async function main(): Promise<void> {
  try {
    // Validate environment before starting build
    await validateEnvironment();

    // Execute build process
    await buildAll();

    log('✨ Build process completed successfully', 'build', 'info');
    process.exit(0);

  } catch (error) {
    log(`🚨 Build process failed: ${error.message}`, 'build', 'error');

    // Ensure clean exit with error code
    process.exit(1);
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught Exception: ${error.message}`, 'build', 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled Rejection: ${reason}`, 'build', 'error');
  process.exit(1);
});

// Graceful shutdown on SIGINT/SIGTERM
process.on('SIGINT', () => {
  log('🛑 Build interrupted by user', 'build', 'info');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('🛑 Build terminated', 'build', 'info');
  process.exit(143);
});

// Execute main function
main();
