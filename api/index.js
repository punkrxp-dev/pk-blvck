import { createServer } from 'http';
import { registerRoutes } from '../dist/index.cjs';

let server;

export default async function handler(req, res) {
  if (!server) {
    // Create Express app only once
    const express = (await import('express')).default;
    const app = express();

    // Register all routes
    await registerRoutes(createServer(app), app);

    server = createServer(app);
  }

  // Handle Vercel request
  server.emit('request', req, res);
}