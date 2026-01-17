import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import { rm, readFile, writeFile } from 'fs/promises';

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  '@google/generative-ai',
  'axios',
  'connect-pg-simple',
  'cors',
  'date-fns',
  'drizzle-orm',
  'drizzle-zod',
  'express',
  'express-rate-limit',
  'express-session',
  'jsonwebtoken',
  'memorystore',
  'multer',
  'nanoid',
  'nodemailer',
  'openai',
  'passport',
  'passport-local',
  'pg',
  'stripe',
  'uuid',
  'ws',
  'xlsx',
  'zod',
  'zod-validation-error',
];

async function updateSEOFiles() {
  console.log('updating SEO files...');

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Update sitemap.xml
  const sitemapPath = 'client/public/sitemap.xml';
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pk-blvck.vercel.app/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  await writeFile(sitemapPath, sitemapContent);

  console.log('✅ SEO files updated with current date:', today);
}

async function buildAll() {
  await rm('dist', { recursive: true, force: true });

  // Update SEO files before building
  await updateSEOFiles();

  console.log('building client...');
  await viteBuild();

  console.log('building server...');
  const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter(dep => !allowlist.includes(dep));

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
  });
}

buildAll().catch(err => {
  console.error(err);
  process.exit(1);
});
