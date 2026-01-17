/**
 * Action Router Tool (Fluxo Fantasma)
 *
 * Camada de decisão inteligente que determina COMO e QUANDO agir
 * com base em intent, dados enriquecidos e contexto da fonte.
 *
 * O sistema NÃO executa todas as ações imediatamente,
 * mas DECIDE e REGISTRA o que deve ser feito.
 */

import { log } from '../../utils/logger';

// ========================================
// TYPES & INTERFACES
// ========================================

export type ActionType =
  | 'notify_immediate' // Email imediato ao gestor
  | 'prepare_whatsapp' // Preparar mensagem WhatsApp (não envia)
  | 'prepare_instagram_dm' // Preparar DM Instagram
  | 'silent_queue' // Guardar para follow-up manual
  | 'archive' // Arquivar (spam/low)
  | 'nurture_sequence'; // Observação progressiva (silent_followup)

export type RecommendedChannel = 'email' | 'whatsapp' | 'instagram' | 'phone' | 'dashboard_only';

export type ActionPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export interface ActionDecision {
  action: ActionType;
  recommendedChannel: RecommendedChannel;
  priority: ActionPriority;
  suggestedMessage: string;
  executeNow: boolean;
  reasoning: string;
  metadata: {
    estimatedResponseTime?: string;
    bestTimeToContact?: string;
    alternativeChannels?: RecommendedChannel[];
  };
}

export interface ActionRouterInput {
  intent: 'alto' | 'médio' | 'baixo' | 'spam';
  confidence: number;
  enrichedData: {
    firstName?: string;
    lastName?: string;
    company?: string;
    position?: string;
    linkedin?: string;
    phone?: string;
    verified: boolean;
  };
  source: string;
  userReply: string;
  accountContext?: {
    domain: string;
    totalLeads: number;
    avgIntent: string;
    lastInteraction: string;
  };
}

// ========================================
// DECISION ENGINE
// ========================================

/**
 * Decide a ação apropriada baseada em regras + contexto
 */
export function routeAction(input: ActionRouterInput): ActionDecision {
  const { intent, confidence, enrichedData, source, userReply, accountContext } = input;

  log(
    `🕶️ ACTION ROUTER - Analyzing: intent=${intent}, confidence=${confidence}, source=${source}`,
    'action-router'
  );

  // ========================================
  // REGRA 1: SPAM/LOW → ARCHIVE
  // ========================================
  if (intent === 'spam') {
    return {
      action: 'archive',
      recommendedChannel: 'dashboard_only',
      priority: 'none',
      suggestedMessage: '',
      executeNow: true,
      reasoning: 'Lead classificado como spam - arquivado automaticamente',
      metadata: {},
    };
  }

  if (intent === 'baixo') {
    return {
      action: 'silent_queue',
      recommendedChannel: 'email',
      priority: 'low',
      suggestedMessage: userReply,
      executeNow: false,
      reasoning: 'Lead de baixa prioridade - guardado para follow-up manual futuro',
      metadata: {
        estimatedResponseTime: '3-5 dias úteis',
        bestTimeToContact: 'tarde',
      },
    };
  }

  // ========================================
  // REGRA 2: HIGH INTENT → AÇÃO IMEDIATA
  // ========================================
  if (intent === 'alto') {
    // REGRA CRÍTICA: Múltiplos leads do mesmo domínio (B2B Signal)
    // Indica conta corporativa ativa - prioridade máxima
    if (accountContext && accountContext.totalLeads >= 2) {
      return {
        action: 'notify_immediate',
        recommendedChannel: 'email',
        priority: 'urgent',
        suggestedMessage: userReply,
        executeNow: true,
        reasoning: `Conta com múltiplos sinais ativos (${accountContext.totalLeads} leads de ${accountContext.domain}). B2B detectado - atenção imediata necessária.`,
        metadata: {
          estimatedResponseTime: 'imediato (15min)',
          bestTimeToContact: 'agora',
          alternativeChannels: ['phone', 'whatsapp'],
        },
      };
    }

    const isCLevel =
      enrichedData.position &&
      (enrichedData.position.toLowerCase().includes('ceo') ||
        enrichedData.position.toLowerCase().includes('founder') ||
        enrichedData.position.toLowerCase().includes('diretor') ||
        enrichedData.position.toLowerCase().includes('president'));

    const isFromAds =
      source.toLowerCase().includes('ad') ||
      source.toLowerCase().includes('campaign') ||
      source.toLowerCase().includes('trafego');

    // CEO/Founder de campanhas pagas → WhatsApp + Email
    if (isCLevel && isFromAds) {
      return {
        action: 'prepare_whatsapp',
        recommendedChannel: 'whatsapp',
        priority: 'urgent',
        suggestedMessage: userReply,
        executeNow: false,
        reasoning: `${enrichedData.position} via tráfego pago - alta chance de conversão. Preparar abordagem premium via WhatsApp.`,
        metadata: {
          estimatedResponseTime: 'imediato (30min)',
          bestTimeToContact: 'manhã (09h-11h)',
          alternativeChannels: ['email', 'phone'],
        },
      };
    }

    // High intent de landing page orgânica ou THE SIGNAL → Email + Dashboard
    if (!isFromAds) {
      const isTheSignal = source === 'the_signal_experience';
      return {
        action: 'notify_immediate',
        recommendedChannel: 'email',
        priority: isTheSignal ? 'urgent' : 'high',
        suggestedMessage: userReply,
        executeNow: true,
        reasoning: isTheSignal
          ? 'Lead qualificado via THE SIGNAL (Experiência Interativa) - Altíssimo engajamento'
          : 'Lead qualificado via landing page - interesse orgânico demonstrado',
        metadata: {
          estimatedResponseTime: isTheSignal ? 'imediato (30min)' : '1-2 horas',
          bestTimeToContact: 'manhã',
          alternativeChannels: ['whatsapp'],
        },
      };
    }

    // High intent genérico → Email imediato
    return {
      action: 'notify_immediate',
      recommendedChannel: 'email',
      priority: 'high',
      suggestedMessage: userReply,
      executeNow: true,
      reasoning: 'Lead de alta prioridade - notificação imediata ao gestor',
      metadata: {
        estimatedResponseTime: '1-2 horas',
        bestTimeToContact: 'horário comercial',
      },
    };
  }

  // ========================================
  // REGRA 3: MEDIUM INTENT → NURTURE
  // ========================================
  if (intent === 'médio') {
    const hasPhone = !!enrichedData.phone;
    const hasLinkedIn = !!enrichedData.linkedin;

    // Se tem phone/LinkedIn → Preparar contato multi-canal
    if (hasPhone || hasLinkedIn) {
      return {
        action: 'prepare_whatsapp',
        recommendedChannel: hasPhone ? 'whatsapp' : 'instagram',
        priority: 'medium',
        suggestedMessage: userReply,
        executeNow: false,
        reasoning: 'Lead médio com dados de contato - preparar abordagem personalizada',
        metadata: {
          estimatedResponseTime: '24 horas',
          bestTimeToContact: 'tarde (14h-16h)',
          alternativeChannels: hasPhone ? ['email', 'instagram'] : ['email'],
        },
      };
    }

    // Sem dados adicionais → Nurture sequence
    return {
      action: 'nurture_sequence',
      recommendedChannel: 'email',
      priority: 'medium',
      suggestedMessage: userReply,
      executeNow: false,
      reasoning: 'Lead médio - adicionar à sequência de nutrição automática',
      metadata: {
        estimatedResponseTime: '48 horas',
        bestTimeToContact: 'manhã',
      },
    };
  }

  // Fallback (não deveria chegar aqui)
  return {
    action: 'silent_queue',
    recommendedChannel: 'dashboard_only',
    priority: 'low',
    suggestedMessage: userReply,
    executeNow: false,
    reasoning: 'Lead sem classificação clara - guardado para revisão manual',
    metadata: {},
  };
}

// ========================================
// ADVANCED DECISION HELPERS
// ========================================

/**
 * Determina o melhor horário para contato baseado em contexto
 */
export function determineBestContactTime(position?: string): string {
  if (!position) return 'horário comercial';

  const positionLower = position.toLowerCase();

  // C-Level → manhã cedo
  if (
    positionLower.includes('ceo') ||
    positionLower.includes('founder') ||
    positionLower.includes('president')
  ) {
    return 'manhã (07h-09h)';
  }

  // Gerência → manhã/tarde
  if (positionLower.includes('manager') || positionLower.includes('gerente')) {
    return 'manhã (10h-12h) ou tarde (14h-16h)';
  }

  // Coordenação → tarde
  if (positionLower.includes('coordenador') || positionLower.includes('coordinator')) {
    return 'tarde (14h-17h)';
  }

  return 'horário comercial';
}

/**
 * Analisa fonte para determinar urgência
 */
export function analyzeSourceUrgency(source: string): 'urgent' | 'high' | 'normal' {
  const sourceLower = source.toLowerCase();

  // Tráfego pago → urgente (custo por lead)
  if (
    sourceLower.includes('ad') ||
    sourceLower.includes('campaign') ||
    sourceLower.includes('paid')
  ) {
    return 'urgent';
  }

  // Indicação/parceiro → alta
  if (sourceLower.includes('referral') || sourceLower.includes('partner')) {
    return 'high';
  }

  // Orgânico → normal
  return 'normal';
}

/**
 * Sugere canais alternativos baseados em dados disponíveis
 */
export function suggestAlternativeChannels(
  enrichedData: ActionRouterInput['enrichedData']
): RecommendedChannel[] {
  const channels: RecommendedChannel[] = [];

  if (enrichedData.phone) channels.push('whatsapp');
  if (enrichedData.linkedin) channels.push('instagram'); // Proxy para LinkedIn outreach
  if (enrichedData.verified) channels.push('email');

  // Sempre incluir dashboard como fallback
  if (channels.length === 0) channels.push('dashboard_only');

  return channels;
}

// ========================================
// LOGGING & TELEMETRY
// ========================================

/**
 * Registra decisão do Action Router para análise posterior
 */
export function logActionDecision(decision: ActionDecision, leadId: string) {
  log(`🕶️ ACTION DECISION [${leadId}]:`, 'action-router');
  log(`  Action: ${decision.action}`, 'action-router');
  log(`  Channel: ${decision.recommendedChannel}`, 'action-router');
  log(`  Priority: ${decision.priority}`, 'action-router');
  log(`  Execute Now: ${decision.executeNow}`, 'action-router');
  log(`  Reasoning: ${decision.reasoning}`, 'action-router');
}
