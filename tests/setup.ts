// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key-for-testing-only';

// Global test setup can be added here if needed