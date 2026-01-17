/* global console */
import { createServer } from 'http';
import serverBundle from '../dist/index.cjs';
const { app, registerRoutes } = serverBundle;

let server;

export default async function handler(req, res) {
  try {
    // Initialize server on first request
    if (!server) {
      console.log('🚀 Initializing PUNK BLVCK Vercel server...');

      // Note: 'app' IS THE PRE-CONFIGURED INSTANCE from server/index.ts
      // It already has CORS, Helmet, RateLimiting, etc.

      server = createServer(app);

      // We explicitly register routes again to ensure they are attached to this specific httpServer instance
      // and to guarantee they are ready before serving requests.
      // This is safe because Express router stack handles additions fine.
      try {
        await registerRoutes(server, app);
        console.log('✅ All routes registered successfully');
      } catch (routeError) {
        console.error('❌ Failed to register routes:', routeError);
        throw routeError;
      }

      console.log('🎯 PUNK BLVCK server ready for requests');
    }

    // Handle Vercel request with error boundary
    server.emit('request', req, res);

  } catch (error) {
    console.error('💥 Fatal error in Vercel handler:', error);

    // Ensure response is sent even on fatal errors
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      });
    }
  }
}