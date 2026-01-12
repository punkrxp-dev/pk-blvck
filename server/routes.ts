import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import passport from 'passport';
import { storage } from './storage';
import { insertUserSchema, loginSchema, type User } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import { processLead } from './ai/orchestrator';
import { z } from 'zod';

// ========================================
// VALIDATION SCHEMAS
// ========================================

const mcpIngestSchema = z.object({
  email: z.string().email('Invalid email address'),
  message: z.string().optional(),
  source: z.string().min(1, 'Source is required'),
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const validationResult = insertUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationError.details,
        });
      }

      const user = await storage.createUser(validationResult.data);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof Error && error.message === 'Username already exists') {
        return res.status(409).json({ message: 'Username already exists' });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req: Request, res: Response) => {
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as User;
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout(err => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Protected routes example
  app.get('/api/users', (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    // Example protected route - in real app this would fetch users
    res.json({ message: 'Protected resource accessed' });
  });

  // ========================================
  // MCP ROUTES - Heavy Metal Flow
  // ========================================

  /**
   * POST /api/mcp/ingest
   * 
   * Main endpoint for lead ingestion and processing
   * Orchestrates the entire Heavy Metal Flow:
   * 1. Enrich lead data
   * 2. Classify intent with AI
   * 3. Save to database
   * 4. Send notifications
   * 
   * Body: { email, message?, source }
   * Returns: Processed lead with classification
   */
  app.post('/api/mcp/ingest', async (req: Request, res: Response) => {
    try {
      // Validate input
      const validationResult = mcpIngestSchema.safeParse(req.body);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({
          message: 'Validation failed',
          errors: validationError.details,
        });
      }

      const { email, message, source } = validationResult.data;

      // Process lead through orchestrator
      const result = await processLead({
        email,
        message,
        source,
      });

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Lead processed successfully',
        data: {
          id: result.id,
          email: result.email,
          intent: result.classification.intent,
          confidence: result.classification.confidence,
          reasoning: result.classification.reasoning,
          model: result.classification.model,
          enrichedData: result.enrichedData,
          notified: result.notified,
          processingTime: result.processingTime,
        },
      });

    } catch (error) {
      console.error('MCP Ingest error:', error);

      // Return error response
      res.status(500).json({
        success: false,
        message: 'Failed to process lead',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/mcp/health
   * 
   * Health check endpoint for MCP system
   * Returns status of AI models and database
   */
  app.get('/api/mcp/health', async (req: Request, res: Response) => {
    try {
      const { checkAIConfig } = await import('./ai/models');
      const aiConfig = checkAIConfig();

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ai: {
          openai: aiConfig.openai ? 'configured' : 'not configured',
          google: aiConfig.google ? 'configured' : 'not configured',
          hasAnyModel: aiConfig.hasAnyModel,
        },
        database: {
          connected: true, // Would check actual connection in production
        },
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/mcp/leads
   * 
   * Retrieves leads from database with optional filtering
   * Query params:
   * - status: Filter by status (pending, processed, notified, failed)
   * - intent: Filter by AI classification intent (high, medium, low, spam)
   * - limit: Number of leads to return (default: 50, max: 100)
   * 
   * Returns: Array of leads with statistics
   */
  app.get('/api/mcp/leads', async (req: Request, res: Response) => {
    try {
      const { db } = await import('./db');
      const { leads } = await import('@shared/schema');
      const { eq, desc, and, sql } = await import('drizzle-orm');

      // Parse query parameters
      const statusFilter = req.query.status as string | undefined;
      const intentFilter = req.query.intent as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      // Build where conditions
      const conditions = [];
      if (statusFilter) {
        conditions.push(eq(leads.status, statusFilter));
      }
      if (intentFilter) {
        conditions.push(sql`${leads.aiClassification}->>'intent' = ${intentFilter}`);
      }

      // Fetch leads
      const leadsData = await db
        .select()
        .from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(leads.createdAt))
        .limit(limit);

      // Calculate statistics
      const allLeads = await db.select().from(leads);

      const stats = {
        total: allLeads.length,
        high: allLeads.filter(l => l.aiClassification?.intent === 'high').length,
        medium: allLeads.filter(l => l.aiClassification?.intent === 'medium').length,
        low: allLeads.filter(l => l.aiClassification?.intent === 'low').length,
        spam: allLeads.filter(l => l.aiClassification?.intent === 'spam').length,
        processedToday: allLeads.filter(l => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return l.createdAt >= today;
        }).length,
      };

      res.status(200).json({
        success: true,
        data: leadsData,
        stats,
        meta: {
          count: leadsData.length,
          limit,
          filters: {
            status: statusFilter || null,
            intent: intentFilter || null,
          },
        },
      });

    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch leads',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return httpServer;

}
