// Carregar variáveis de ambiente do .env
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { serveStatic } from './static';
import { createServer } from 'http';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import MemoryStore from 'memorystore';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { storage } from './storage';
import { type User } from '@shared/schema';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      password: string;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
  }
}

const app = express();
const httpServer = createServer(app);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Benchmark endpoint (before all middleware)
app.post('/api/mcp/benchmark', express.json(), async (req: Request, res: Response) => {
  try {
    // Simple validation
    const { email, message, source, mode } = req.body;
    if (!email || !source) {
      return res.status(400).json({ error: 'Email and source are required' });
    }

    const { processLeadPipeline } = await import('./ai/mcp/pipeline');
    const { processLead: processLeadLegacy } = await import('./ai/legacy/orchestrator');

    let result;
    if (mode === 'legacy') {
      log('[BENCHMARK] Using LEGACY mode', 'benchmark');
      result = await processLeadLegacy({ email, message, source });

      // Transform legacy result
      result = {
        id: result.id,
        email: result.email,
        intent: {
          intent: result.classification.intent,
          confidence: result.classification.confidence,
          reasoning: result.classification.reasoning,
          userReply: result.classification.userReply,
        },
        processing: {
          processingMode: 'legacy',
          actualModel: result.classification.model,
          processingTimeMs: result.processingTime,
          requiresHumanReview: false,
        },
        presence: result.enrichedData,
        notified: result.notified,
        status: result.status,
      };
    } else {
      log('[BENCHMARK] Using NEO mode', 'benchmark');
      result = await processLeadPipeline({ email, message, source });
    }

    res.json(result);
  } catch (error) {
    log(
      `Benchmark error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'benchmark',
      'error'
    );
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Import structured logging utility
import { log } from './utils/logger';

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Vite React Refresh Preamble
          "'unsafe-eval'", // Required for Vite
        ],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        connectSrc: ["'self'", 'ws:', 'wss:'], // Allow HMR WebSockets
        mediaSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Disabled for compatibility
  })
);

app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || false : true,
    credentials: true,
    // Permitir headers customizados para trackers
    exposedHeaders: ['X-CSRF-Token'],
  })
);

// Rate limiting - Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for dev polling
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// API specific limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 2000 : 200, // Higher limit for dev API calls
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication limiter - Very strict
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
});

// Registration limiter - Moderate
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations per hour
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset limiter - Strict
const _passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // limit each IP to 2 password resets per hour
  message: 'Too many password reset attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Apply specific limiters to routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', registerLimiter);
// app.use('/api/auth/reset-password', _passwordResetLimiter); // When implemented
app.use('/api', apiLimiter);

// Body parsing with size limits
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: '10mb',
  })
);

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Input sanitization middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Sanitize all string inputs recursively
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Use DOMPurify to sanitize HTML/XSS
      const window = new JSDOM('').window;
      const DOMPurifyInstance = DOMPurify(window);
      return DOMPurifyInstance.sanitize(obj, { ALLOWED_TAGS: [] }).trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
});

// Session configuration
const MemoryStoreSession = MemoryStore(session);

// Validate SESSION_SECRET - Critical security requirement
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET is required in production. Set SESSION_SECRET environment variable.'
    );
  }
  log(
    'WARNING: SESSION_SECRET not set, using insecure default. Set SESSION_SECRET in production!',
    'security',
    'warn'
  );
}

app.use(
  session({
    secret: sessionSecret || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      // Permitir cookies em desenvolvimento (HTTP)
      // Em produção, secure=true requer HTTPS
      // Nota: Cookies de terceiros (trackers) podem falhar se muito grandes
      // ou se SameSite for muito restritivo
    },
  })
);

// CSRF Protection Middleware
app.use((req, res, next) => {
  // Generate CSRF token for session if not exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

  // Add CSRF token to response headers for client
  res.setHeader('X-CSRF-Token', req.session.csrfToken);

  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Check CSRF token for state-changing operations
  const token = req.headers['x-csrf-token'] || req.headers['csrf-token'] || req.body?._csrf;

  if (!token || token !== req.session.csrfToken) {
    // Silenciar warnings para endpoints conhecidos que não existem (scanners/bots)
    const silentEndpoints = ['/api/v0/swarm/peers', '/api/v0/swarm'];
    if (!silentEndpoints.includes(req.path)) {
      log(`CSRF token validation failed for ${req.method} ${req.path}`, 'security', 'warn');
    }
    return res.status(403).json({
      message: 'CSRF token validation failed',
      error: 'Invalid or missing CSRF token',
    });
  }

  next();
});

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: 'username' },
    async (username: string, password: string, done) => {
      try {
        const user = await storage.authenticateUser({ username, password });
        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  let hasLogged = false; // Prevent multiple logging

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  const logRequest = () => {
    if (hasLogged) return; // Prevent duplicate logging
    hasLogged = true;

    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Sanitize sensitive data before logging
        const sanitizedResponse = sanitizeForLogging(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }
      log(logLine);
    }
  };

  res.on('finish', logRequest);
  res.on('close', logRequest); // Ensure logging happens even if connection closes

  next();
});

// Helper function to sanitize sensitive data from logs
function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) return data;

  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Structured error logging
    log(`HTTP ${status} - ${req.method} ${req.path}: ${message}`, 'error', 'error');

    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(status).json({
        message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: err.stack,
          url: req.url,
          method: req.method,
        }),
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  } else {
    const { setupVite } = await import('./vite');
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen(
    {
      port,
      host: '0.0.0.0',
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
