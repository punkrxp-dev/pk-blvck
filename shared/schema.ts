import { sql } from 'drizzle-orm';
import { pgTable, text, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Strong password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ========================================
// USERS TABLE
// ========================================
export const users = pgTable('users', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores, and hyphens'
      ),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        passwordRegex,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  });

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginSchema>;

// ========================================
// LEADS TABLE (MCP - Heavy Metal Flow)
// ========================================
export const leads = pgTable('leads', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),

  // Raw input data
  rawMessage: text('raw_message'),
  source: text('source').notNull(), // 'web', 'api', 'webhook', etc.

  // Enriched data from Hunter.io (JSONB for flexibility)
  enrichedData: jsonb('enriched_data').$type<{
    firstName?: string;
    lastName?: string;
    company?: string;
    position?: string;
    linkedin?: string;
    phone?: string;
    verified?: boolean;
  }>(),

  // AI Classification (JSONB for structured data)
  aiClassification: jsonb('ai_classification').$type<{
    intent: 'high' | 'medium' | 'low' | 'spam';
    confidence: number;
    reasoning?: string;
    userReply?: string;
    model: 'gpt-4o' | 'gemini-2.0-flash-exp' | 'rule-based';
    processedAt: string;
  }>(),

  // MCP Processing Metadata (Full Transparency)
  processingMetadata: jsonb('processing_metadata').$type<{
    processingMode: 'llm' | 'fallback' | 'rules';
    modelProvider: 'openai' | 'google' | 'rules';
    actualModel: string;
    fallbackUsed: boolean;
    requiresHumanReview: boolean;
    processingTimeMs: number;
    timestamp: string;
    layers: Record<string, any>;
  }>(),

  // Metadata
  status: text('status').notNull().default('pending'), // 'pending', 'processed', 'notified', 'failed'
  notifiedAt: timestamp('notified_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertLeadSchema = createInsertSchema(leads)
  .pick({
    email: true,
    rawMessage: true,
    source: true,
  })
  .extend({
    email: z.string().email('Invalid email address'),
    rawMessage: z.string().optional(),
    source: z.string().min(1, 'Source is required'),
  });

export const leadIntentSchema = z.object({
  intent: z.enum(['high', 'medium', 'low', 'spam']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadIntent = z.infer<typeof leadIntentSchema>;
