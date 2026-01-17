
import { processLeadPipeline } from '../../server/ai/mcp/pipeline';
import { generateObjectWithOpenAI } from '../../server/ai/models';
import { storage } from '../../server/storage';

// Mock dependencies
jest.mock('../../server/ai/models');
jest.mock('../../server/storage');

// Mock memory
jest.mock('../../server/ai/memory', () => ({
    vectorStore: {
        add: jest.fn().mockResolvedValue(true),
    },
}));

// Mock enrichment
jest.mock('../../server/ai/tools/enrichment.tool', () => ({
    enrichLead: jest.fn().mockResolvedValue({
        firstName: 'Test',
        lastName: 'User',
        company: 'Test Corp',
        verified: true
    }),
}));

// Mock action router
jest.mock('../../server/ai/tools/action-router.tool', () => ({
    routeAction: jest.fn().mockReturnValue({
        action: 'notify_sales',
        recommendedChannel: 'email',
        priority: 'high',
        executeNow: true,
        reasoning: 'Test reasoning'
    }),
    logActionDecision: jest.fn(),
}));

// Mock tools (specifically saveLead which is imported by pipeline)
jest.mock('../../server/ai/tools', () => ({
    saveLead: jest.fn().mockResolvedValue({ id: 'mock-lead-id' }),
    notifyLead: jest.fn().mockResolvedValue(true),
}));

describe('Integration: MCP Lead Pipeline', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should process a High Intent Lead successfully', async () => {
        // Mock Sentinel Agent response (Safe)
        (generateObjectWithOpenAI as jest.Mock).mockResolvedValueOnce({
            object: {
                sanitized: true,
                spam: false,
                confidence: 0.9,
            }
        });

        // Mock Intent Agent response (High Intent)
        (generateObjectWithOpenAI as jest.Mock).mockResolvedValueOnce({
            object: {
                intent: 'high',
                confidence: 0.95,
                reasoning: 'Strong buying signal',
                userReply: 'We would love to sell to you.',
            }
        });

        const input = {
            email: 'ceo@techstartup.com',
            message: 'I want to buy 100 licenses.',
            source: 'web'
        };

        const result = await processLeadPipeline(input);

        expect(result.email).toBe(input.email);
        expect(result.intent.intent).toBe('high');
        expect(result.status).toBe('processed');

        // Verify mocks were called
        // Sentinel + Intent = 2 calls
        expect(generateObjectWithOpenAI).toHaveBeenCalledTimes(2);
    });

    it('should block Spam at Sentinel stage', async () => {
        // Mock Sentinel Agent response (Spam)
        (generateObjectWithOpenAI as jest.Mock).mockResolvedValueOnce({
            object: {
                sanitized: false,
                spam: true,
                confidence: 0.99,
                reasoning: 'Casino keywords detected',
            }
        });

        const input = {
            email: 'spammer@spam.com',
            message: 'Visit my casino!',
            source: 'web'
        };

        const result = await processLeadPipeline(input);

        expect(result.intent.intent).toBe('spam');
        // Intent agent should NOT be called
        expect(generateObjectWithOpenAI).toHaveBeenCalledTimes(1);
    });
});
