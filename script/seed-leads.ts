/**
 * 🌱 SEED SCRIPT - PUNK BLVCK LEADS
 *
 * Popula o banco com leads fictícios para validar a UI do Dashboard
 * Distribuição: 3 High, 3 Medium, 2 Low, 2 Spam
 *
 * ⚠️ AVISO: Este script destrói dados existentes antes de criar novos
 * Use apenas em ambientes de desenvolvimento/teste
 */

// Carregar variáveis de ambiente do .env
import 'dotenv/config';
import { log } from '../server/utils/logger';
import { saveLead } from '../server/ai/tools';
import { validateForSeed, reportPrecheckResults } from './precheck';

// Environment validation using precheck utilities
async function validateEnvironment(): Promise<void> {
    const result = await validateForSeed();
    reportPrecheckResults(result, 'Seed');

    if (!result.success) {
        const errorMessage = `Seed prechecks failed: ${result.errors.join(', ')}`;
        throw new Error(errorMessage);
    }
}

// Função auxiliar para gerar datas nos últimos 3 dias
function getRandomDate(daysAgo: number): string {
    const now = new Date();
    const randomHours = Math.floor(Math.random() * (daysAgo * 24));
    const date = new Date(now.getTime() - randomHours * 60 * 60 * 1000);
    return date.toISOString();
}

// Data validation
function validateSeedData(): void {
    log('🔍 Validating seed data...', 'seed', 'info');

    // Check distribution
    const intents = seedLeads.map(lead => lead.aiClassification.intent);
    const distribution = {
        high: intents.filter(i => i === 'alto').length,
        medium: intents.filter(i => i === 'médio').length,
        low: intents.filter(i => i === 'baixo').length,
        spam: intents.filter(i => i === 'spam').length,
    };

    const expected = { high: 3, medium: 3, low: 2, spam: 2 };

    if (JSON.stringify(distribution) !== JSON.stringify(expected)) {
        log(`❌ Invalid distribution: ${JSON.stringify(distribution)} (expected: ${JSON.stringify(expected)})`, 'seed', 'error');
        throw new Error('Seed data distribution mismatch');
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = seedLeads.filter(lead => !emailRegex.test(lead.email));

    if (invalidEmails.length > 0) {
        log(`❌ Invalid email formats: ${invalidEmails.map(l => l.email).join(', ')}`, 'seed', 'error');
        throw new Error('Invalid email formats in seed data');
    }

    log(`✅ Seed data validation passed (${seedLeads.length} leads)`, 'seed', 'info');
}

// Dados dos leads fictícios
const seedLeads = [
    // ========================================
    // 🔥 HIGH INTENT (3) - Vendas Quentes
    // ========================================
    {
        email: 'carlos.mendes@techcorp.com.br',
        rawMessage: 'Olá! Estou procurando uma solução de IA para automatizar nosso atendimento. Temos urgência, podemos agendar uma call essa semana?',
        source: 'web',
        enrichedData: {
            firstName: 'Carlos',
            lastName: 'Mendes',
            company: 'TechCorp Brasil',
            position: 'CTO',
            linkedin: 'https://linkedin.com/in/carlos-mendes-tech',
            verified: true,
        },
        aiClassification: {
            intent: 'alto' as const,
            confidence: 0.92,
            reasoning: 'Demonstra urgência, cargo de decisão (CTO), empresa verificada, interesse específico em produto.',
            model: 'gpt-4o' as const,
            processedAt: getRandomDate(1),
        },
        status: 'processed',
    },
    {
        email: 'ana.silva@startupx.io',
        rawMessage: 'Vi vocês no evento da AWS. Nosso time precisa de uma plataforma de agentes de IA. Qual o investimento inicial?',
        source: 'api',
        enrichedData: {
            firstName: 'Ana',
            lastName: 'Silva',
            company: 'StartupX',
            position: 'Head of Product',
            linkedin: 'https://linkedin.com/in/anasilva-product',
            phone: '+55 11 98765-4321',
            verified: true,
        },
        aiClassification: {
            intent: 'alto' as const,
            confidence: 0.88,
            reasoning: 'Menção a evento (networking qualificado), pergunta sobre preço (fase de decisão), cargo de liderança.',
            model: 'gemini-2.0-flash-exp' as const,
            processedAt: getRandomDate(2),
        },
        status: 'notified',
    },
    {
        email: 'rodrigo.alves@bigretail.com',
        rawMessage: 'Precisamos integrar IA no nosso e-commerce. Vocês têm case de varejo? Nosso budget é de R$ 50k/mês.',
        source: 'web',
        enrichedData: {
            firstName: 'Rodrigo',
            lastName: 'Alves',
            company: 'Big Retail SA',
            position: 'Diretor de Tecnologia',
            linkedin: 'https://linkedin.com/in/rodrigo-alves-retail',
            verified: true,
        },
        aiClassification: {
            intent: 'alto' as const,
            confidence: 0.95,
            reasoning: 'Budget explícito (alto valor), necessidade clara, empresa grande, cargo executivo.',
            model: 'gpt-4o' as const,
            processedAt: getRandomDate(1),
        },
        status: 'processed',
    },

    // ========================================
    // 🟡 MEDIUM INTENT (3) - Dúvidas/Pesquisa
    // ========================================
    {
        email: 'juliana.costa@consultoria.com',
        rawMessage: 'Estou pesquisando soluções de IA para recomendar aos meus clientes. Vocês têm material técnico?',
        source: 'web',
        enrichedData: {
            firstName: 'Juliana',
            lastName: 'Costa',
            company: 'Costa Consultoria',
            position: 'Consultora',
            verified: false,
        },
        aiClassification: {
            intent: 'médio' as const,
            confidence: 0.68,
            reasoning: 'Interesse genuíno mas indireto (para clientes), fase de pesquisa, não menciona urgência.',
            model: 'gemini-2.0-flash-exp' as const,
            processedAt: getRandomDate(2),
        },
        status: 'processed',
    },
    {
        email: 'pedro.santos@freelancer.dev',
        rawMessage: 'Sou desenvolvedor e quero entender melhor como funciona a arquitetura de agentes de vocês.',
        source: 'api',
        enrichedData: {
            firstName: 'Pedro',
            lastName: 'Santos',
            position: 'Desenvolvedor Freelancer',
            linkedin: 'https://linkedin.com/in/pedrosantos-dev',
            verified: false,
        },
        aiClassification: {
            intent: 'médio' as const,
            confidence: 0.55,
            reasoning: 'Interesse técnico, possível futuro cliente ou parceiro, mas sem indicação de compra imediata.',
            model: 'gpt-4o' as const,
            processedAt: getRandomDate(3),
        },
        status: 'pending',
    },
    {
        email: 'mariana.oliveira@edu.br',
        rawMessage: 'Trabalho numa universidade e estamos estudando IA aplicada. Vocês fazem parcerias acadêmicas?',
        source: 'web',
        enrichedData: {
            firstName: 'Mariana',
            lastName: 'Oliveira',
            company: 'Universidade Federal',
            position: 'Professora',
            verified: true,
        },
        aiClassification: {
            intent: 'médio' as const,
            confidence: 0.62,
            reasoning: 'Interesse institucional, potencial parceria, mas não é venda direta.',
            model: 'gemini-2.0-flash-exp' as const,
            processedAt: getRandomDate(2),
        },
        status: 'processed',
    },

    // ========================================
    // 🔵 LOW INTENT (2) - Curiosos
    // ========================================
    {
        email: 'joao.pereira@gmail.com',
        rawMessage: 'Achei legal o site de vocês. O que exatamente vocês fazem?',
        source: 'web',
        enrichedData: {
            firstName: 'João',
            lastName: 'Pereira',
            verified: false,
        },
        aiClassification: {
            intent: 'baixo' as const,
            confidence: 0.45,
            reasoning: 'Pergunta genérica, sem contexto profissional, email pessoal.',
            model: 'gpt-4o' as const,
            processedAt: getRandomDate(3),
        },
        status: 'pending',
    },
    {
        email: 'curiosa123@hotmail.com',
        rawMessage: 'Vi no LinkedIn. Vocês dão consultoria gratuita?',
        source: 'api',
        enrichedData: {
            verified: false,
        },
        aiClassification: {
            intent: 'baixo' as const,
            confidence: 0.38,
            reasoning: 'Busca por serviço gratuito, email não profissional, sem dados de empresa.',
            model: 'gemini-2.0-flash-exp' as const,
            processedAt: getRandomDate(3),
        },
        status: 'pending',
    },

    // ========================================
    // 🚫 SPAM (2)
    // ========================================
    {
        email: 'marketing@spamlist.xyz',
        rawMessage: 'CLICK HERE FOR AMAZING DEALS! Buy followers, likes, and more!!!',
        source: 'webhook',
        enrichedData: {
            verified: false,
        },
        aiClassification: {
            intent: 'spam' as const,
            confidence: 0.98,
            reasoning: 'Mensagem promocional genérica, caps lock excessivo, domínio suspeito (.xyz), conteúdo irrelevante.',
            model: 'gpt-4o' as const,
            processedAt: getRandomDate(1),
        },
        status: 'failed',
    },
    {
        email: 'noreply@seo-services.biz',
        rawMessage: 'We can rank your website #1 on Google in 24 hours! Contact us now for special discount!',
        source: 'webhook',
        enrichedData: {
            verified: false,
        },
        aiClassification: {
            intent: 'spam' as const,
            confidence: 0.96,
            reasoning: 'Promessa irrealista, email noreply, domínio .biz suspeito, oferta não solicitada.',
            model: 'gemini-2.0-flash-exp' as const,
            processedAt: getRandomDate(2),
        },
        status: 'failed',
    },
];

// ========================================
// 🚀 EXECUTAR SEED
// ========================================
async function runSeed(): Promise<void> {
    const startTime = Date.now();
    const createdLeads: string[] = [];

    try {
        log('🌱 Starting seed process...', 'seed', 'info');

        // Validate environment and data before starting
        await validateEnvironment();
        validateSeedData();

        // Show warning about destructive operation
        log('⚠️  WARNING: This will overwrite existing leads with the same emails!', 'seed', 'warn');
        log(`📊 Preparing to seed ${seedLeads.length} leads...`, 'seed', 'info');

        let successCount = 0;
        let errorCount = 0;

        // Process leads with rollback capability
        for (const lead of seedLeads) {
            try {
                await saveLead(lead);
                createdLeads.push(lead.email);
                successCount++;
                log(`✅ Lead created: ${lead.email} (${lead.aiClassification.intent})`, 'seed', 'info');
            } catch (error) {
                errorCount++;
                log(`❌ Failed to create lead ${lead.email}: ${error instanceof Error ? error.message : 'Unknown error'}`, 'seed', 'error');

                // Continue processing but track failures
                // Note: In a real rollback scenario, you might want to undo previous operations
            }
        }

        const duration = Date.now() - startTime;

        // Final report
        log('\n✅ Seed process completed!', 'seed', 'info');
        log(`   ⏱️  Duration: ${duration}ms`, 'seed', 'info');
        log(`   📊 Successes: ${successCount}`, 'seed', 'info');
        log(`   ❌ Errors: ${errorCount}`, 'seed', 'info');

        log('\n📈 Distribution:', 'seed', 'info');
        log('   🔥 High Intent: 3 leads', 'seed', 'info');
        log('   🟡 Medium Intent: 3 leads', 'seed', 'info');
        log('   🔵 Low Intent: 2 leads', 'seed', 'info');
        log('   🚫 Spam: 2 leads', 'seed', 'info');

        if (errorCount > 0) {
            log(`\n⚠️  ${errorCount} leads failed to create. Check logs above.`, 'seed', 'warn');
            process.exit(1); // Exit with error if any failures
        } else {
            log('\n🎉 All leads created successfully!', 'seed', 'info');
            process.exit(0);
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        log(`💥 Seed process failed after ${duration}ms: ${error instanceof Error ? error.message : 'Unknown error'}`, 'seed', 'error');

        // Log created leads for potential cleanup
        if (createdLeads.length > 0) {
            log(`📝 Created leads before failure: ${createdLeads.join(', ')}`, 'seed', 'warn');
            log('🧹 Manual cleanup may be required', 'seed', 'warn');
        }

        process.exit(1);
    }
}

// ========================================
// 🚀 EXECUÇÃO PRINCIPAL
// ========================================
async function main(): Promise<void> {
    try {
        // Environment validation is now done inside runSeed()

        // Run the seed process
        await runSeed();

    } catch (error) {
        log(`🚨 Fatal error in seed script: ${error instanceof Error ? error.message : 'Unknown error'}`, 'seed', 'error');
        process.exit(1);
    }
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    log(`💥 Uncaught Exception: ${error.message}`, 'seed', 'error');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`💥 Unhandled Rejection: ${reason}`, 'seed', 'error');
    process.exit(1);
});

// Graceful shutdown on SIGINT/SIGTERM
process.on('SIGINT', () => {
    log('🛑 Seed interrupted by user', 'seed', 'info');
    process.exit(130);
});

process.on('SIGTERM', () => {
    log('🛑 Seed terminated', 'seed', 'info');
    process.exit(143);
});

// Execute main function
main();
