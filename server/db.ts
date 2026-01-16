import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, leads } from '@shared/schema';

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

/**
 * PostgreSQL connection client with optimized settings for Neon
 *
 * Configuration:
 * - max: 10 connections (Neon free tier limit)
 * - idle_timeout: 30s (close idle connections)
 * - connect_timeout: 10s (fail fast on connection issues)
 */
export const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  ssl: 'require', // Neon sempre requer SSL
});

/**
 * Drizzle ORM instance
 *
 * This is the main database instance used throughout the application.
 * Import this instead of creating new connections.
 */
export const db = drizzle(client, {
  schema: { users, leads },
  logger: process.env.NODE_ENV === 'development',
});

/**
 * Graceful shutdown handler
 * Call this when the application is shutting down
 */
export async function closeDatabase() {
  await client.end();
  console.log('Database connection closed');
}
