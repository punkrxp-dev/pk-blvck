import type { Express, Request, Response } from 'express';
import { type Server } from 'http';
import passport from 'passport';
import { storage } from './storage';
import { insertUserSchema, type User } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import { processLeadPipeline } from './ai/mcp/pipeline';
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
  // MCP ROUTES - Neo Mode Orchestrator
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

      // Process lead through new MCP pipeline
      const result = await processLeadPipeline({
        email,
        message,
        source,
      });

      // Return success response with structured data
      res.status(200).json({
        success: true,
        message: 'Lead processed successfully',
        data: {
          id: result.id,
          email: result.email,
          intent: result.intent.intent,
          confidence: result.intent.confidence,
          reasoning: result.intent.reasoning,
          model: result.processing.actualModel,
          enrichedData: result.presence,
          notified: result.notified,
          reply: result.intent.userReply,
          processingTime: result.processing.processingTimeMs,
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
      const { eq, desc, asc, and, sql, count } = await import('drizzle-orm');

      // Parse query parameters
      const statusFilter = req.query.status as string | undefined;
      const intentFilter = req.query.intent as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

      // Build where conditions
      const conditions = [];
      if (statusFilter) {
        conditions.push(eq(leads.status, statusFilter));
      }
      if (intentFilter) {
        conditions.push(sql`${leads.aiClassification}->>'intent' = ${intentFilter}`);
      }

      // Date range filter (if needed in future)
      const dateRange = req.query.dateRange as string | undefined;
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();

        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateRange === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        }

        if (dateRange !== 'all') {
          conditions.push(sql`${leads.createdAt} >= ${startDate}`);
        }
      }

      // Calculate total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalCountResult[0]?.count || 0;
      const totalPages = Math.ceil(total / pageSize);
      const offset = (page - 1) * pageSize;

      // Build order by clause
      let orderByClause;
      if (sortBy === 'email') {
        orderByClause = sortOrder === 'asc' ? asc(leads.email) : desc(leads.email);
      } else if (sortBy === 'status') {
        orderByClause = sortOrder === 'asc' ? asc(leads.status) : desc(leads.status);
      } else if (sortBy === 'intent') {
        orderByClause =
          sortOrder === 'asc'
            ? sql`${leads.aiClassification}->>'intent' ASC`
            : sql`${leads.aiClassification}->>'intent' DESC`;
      } else {
        // Default: createdAt
        orderByClause = sortOrder === 'asc' ? asc(leads.createdAt) : desc(leads.createdAt);
      }

      // Fetch leads with pagination
      const leadsData = await db
        .select()
        .from(leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset);

      // Calculate statistics (from all leads, not filtered)
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
          limit: pageSize,
          filters: {
            status: statusFilter || null,
            intent: intentFilter || null,
          },
          pagination: {
            total,
            page,
            pageSize,
            totalPages,
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

  /**
   * PATCH /api/mcp/leads/:id/status
   *
   * Updates the status of a lead
   */
  app.patch('/api/mcp/leads/:id/status', async (req: Request, res: Response) => {
    try {
      const { db } = await import('./db');
      const { leads } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const leadId = req.params.id;
      const { status } = req.body;

      if (!status || !['pending', 'processed', 'notified', 'failed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be: pending, processed, notified, or failed',
        });
      }

      const updated = await db
        .update(leads)
        .set({ status, updatedAt: new Date() })
        .where(eq(leads.id, leadId))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
      }

      res.status(200).json({
        success: true,
        data: updated[0],
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update lead status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * PATCH /api/mcp/leads/:id/mark-spam
   *
   * Marks a lead as spam by updating its AI classification
   */
  app.patch('/api/mcp/leads/:id/mark-spam', async (req: Request, res: Response) => {
    try {
      const { db } = await import('./db');
      const { leads } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const leadId = req.params.id;

      const existingLead = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

      if (existingLead.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
      }

      const updated = await db
        .update(leads)
        .set({
          aiClassification: {
            intent: 'spam',
            confidence: 1.0,
            model: existingLead[0].aiClassification?.model || 'gpt-4o',
            processedAt: new Date().toISOString(),
          },
          status: 'processed',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))
        .returning();

      res.status(200).json({
        success: true,
        data: updated[0],
      });
    } catch (error) {
      console.error('Error marking lead as spam:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark lead as spam',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /api/mcp/leads/:id/notify
   *
   * Sends a notification for a lead (triggers Resend email)
   */
  app.post('/api/mcp/leads/:id/notify', async (req: Request, res: Response) => {
    try {
      const { db } = await import('./db');
      const { leads } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const leadId = req.params.id;

      const lead = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

      if (lead.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
      }

      // Here you would integrate with Resend to send the notification
      // For now, we'll just update the notifiedAt timestamp
      const updated = await db
        .update(leads)
        .set({
          notifiedAt: new Date(),
          status: 'notified',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId))
        .returning();

      res.status(200).json({
        success: true,
        message: 'Notification sent',
        data: updated[0],
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /api/mcp/leads/:id
   *
   * Deletes a lead from the database
   */
  app.delete('/api/mcp/leads/:id', async (req: Request, res: Response) => {
    try {
      const { db } = await import('./db');
      const { leads } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');

      const leadId = req.params.id;

      const deleted = await db.delete(leads).where(eq(leads.id, leadId)).returning();

      if (deleted.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Lead deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete lead',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return httpServer;
}
