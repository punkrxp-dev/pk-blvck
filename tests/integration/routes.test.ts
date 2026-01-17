
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { registerRoutes } from '../../server/routes';
import { storage } from '../../server/storage';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import { processLeadPipeline } from '../../server/ai/mcp/pipeline';

// Mock storage
jest.mock('../../server/storage');

// Mock AI pipeline
jest.mock('../../server/ai/mcp/pipeline', () => ({
    processLeadPipeline: jest.fn(),
}));

// Mock Legacy pipeline
jest.mock('../../server/ai/legacy/orchestrator', () => ({
    processLead: jest.fn(),
}));

describe('Integration: API Routes', () => {
    let app: express.Express;
    let server: Server;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        // Minimal session/auth setup for testing
        app.use(session({ secret: 'test', resave: false, saveUninitialized: false }));
        app.use(passport.initialize());
        app.use(passport.session());

        // Setup Mock Passport Strategy
        passport.use(new LocalStrategy(async (username, password, done) => {
            // Simple mock authentication logic
            if (username === 'testuser' && password === 'Password123!') {
                return done(null, { id: '1', username: 'testuser' } as any);
            }
            return done(null, false);
        }));

        passport.serializeUser((user: any, done) => done(null, user));
        passport.deserializeUser((user: any, done) => done(null, user));

        server = createServer(app);
        await registerRoutes(server, app);
        await new Promise<void>((resolve) => server.listen(0, () => resolve()));
    });

    afterAll(async () => {
        await new Promise((resolve) => server.close(resolve));
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            (storage.createUser as jest.Mock).mockResolvedValue({
                id: '1',
                username: 'testuser',
                password: 'hashedpassword',
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            const res = await request(server)
                .post('/api/auth/register')
                .send({ username: 'testuser', password: 'Password123!' });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('username', 'testuser');
            expect(res.body).not.toHaveProperty('password');
        });

        it('should fail if username already exists', async () => {
            (storage.createUser as jest.Mock).mockRejectedValue(new Error('Username already exists'));

            const res = await request(server)
                .post('/api/auth/register')
                .send({ username: 'existing', password: 'Password123!' });

            expect(res.status).toBe(409);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'Password123!' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Login successful');
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(server)
                .post('/api/auth/login')
                .send({ username: 'wrong', password: 'wrong' });

            expect(res.status).toBe(401);
        });
    });

    describe('POST /api/mcp/ingest', () => {
        it('should process a valid lead in NEO mode', async () => {
            const mockResult = {
                id: 'lead-1',
                email: 'lead@test.com',
                intent: {
                    intent: 'alto',
                    confidence: 0.9,
                    reasoning: 'Strong interest',
                    userReply: 'Thanks',
                },
                processing: { actualModel: 'gpt-4', processingTimeMs: 100 },
                presence: {},
                notified: false,
            };

            (processLeadPipeline as jest.Mock).mockResolvedValue(mockResult);

            const res = await request(server)
                .post('/api/mcp/ingest')
                .send({
                    email: 'lead@test.com',
                    message: 'I want to buy',
                    source: 'web'
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(processLeadPipeline).toHaveBeenCalledWith({
                email: 'lead@test.com',
                message: 'I want to buy',
                source: 'web'
            });
        });

        it('should validation fail for invalid email', async () => {
            const res = await request(server)
                .post('/api/mcp/ingest')
                .send({
                    email: 'not-an-email',
                    message: 'hello',
                    source: 'web'
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('Validation failed');
        });
    });
});
