/**
 * 🌱 SEED SCRIPT - PUNK BLACK LEADS
 * 
 * Popula o banco com leads fictícios para validar a UI do Dashboard
 * Distribuição: 3 High, 3 Medium, 2 Low, 2 Spam
 */

// Carregar variáveis de ambiente do .env
import 'dotenv/config';

import { saveLead } from '../server/ai/tools';

// Função auxiliar para gerar datas nos últimos 3 dias
function getRandomDate(daysAgo: number): string {
    const now = new Date();
    const randomHours = Math.floor(Math.random() * (daysAgo * 24));
    const date = new Date(now.getTime() - randomHours * 60 * 60 * 1000);
    return date.toISOString();
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
            intent: 'high' as const,
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
            intent: 'high' as const,
            confidence: 0.88,
            reasoning: 'Menção a evento (networking qualificado), pergunta sobre preço (fase de decisão), cargo de liderança.',
            model: 'gemini-2.0-flash' as const,
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
            intent: 'high' as const,
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
            intent: 'medium' as const,
            confidence: 0.68,
            reasoning: 'Interesse genuíno mas indireto (para clientes), fase de pesquisa, não menciona urgência.',
            model: 'gemini-2.0-flash' as const,
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
            intent: 'medium' as const,
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
            intent: 'medium' as const,
            confidence: 0.62,
            reasoning: 'Interesse institucional, potencial parceria, mas não é venda direta.',
            model: 'gemini-2.0-flash' as const,
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
            intent: 'low' as const,
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
            intent: 'low' as const,
            confidence: 0.38,
            reasoning: 'Busca por serviço gratuito, email não profissional, sem dados de empresa.',
            model: 'gemini-2.0-flash' as const,
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
            model: 'gemini-2.0-flash' as const,
            processedAt: getRandomDate(2),
        },
        status: 'failed',
    },
];

// ========================================
// 🚀 EXECUTAR SEED
// ========================================
async function runSeed() {
    console.log('🌱 Iniciando seed de leads...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const lead of seedLeads) {
        try {
            await saveLead(lead);
            successCount++;
        } catch (error) {
            console.error(`❌ Erro ao criar lead ${lead.email}:`, error);
            errorCount++;
        }
    }

    console.log('\n✅ Seed concluído!');
    console.log(`   📊 Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log('\n📈 Distribuição:');
    console.log('   🔥 High Intent: 3 leads');
    console.log('   🟡 Medium Intent: 3 leads');
    console.log('   🔵 Low Intent: 2 leads');
    console.log('   🚫 Spam: 2 leads');

    process.exit(0);
}

// Executar
runSeed().catch((error) => {
    console.error('💥 Erro fatal no seed:', error);
    process.exit(1);
});
