/* global console */
import { createServer } from 'http';
import serverBundle from '../dist/index.cjs';
const { registerRoutes } = serverBundle;

let server;

export default async function handler(req, res) {
  try {
    // Initialize server on first request
    if (!server) {
      console.log('🚀 Initializing PUNK BLVCK Vercel server...');

      // Create Express app
      const express = (await import('express')).default;
      const app = express();

      // Register all routes with error handling
      try {
        await registerRoutes(createServer(app), app);
        console.log('✅ All routes registered successfully');
      } catch (routeError) {
        console.error('❌ Failed to register routes:', routeError);
        res.status(500).json({
          error: 'Server initialization failed',
          message: 'Unable to register routes'
        });
        return;
      }

      server = createServer(app);
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