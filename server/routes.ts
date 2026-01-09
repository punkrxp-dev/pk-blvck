import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import passport from 'passport';
import { storage } from './storage';
import { insertUserSchema, loginSchema, type User } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';

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

  return httpServer;
}
