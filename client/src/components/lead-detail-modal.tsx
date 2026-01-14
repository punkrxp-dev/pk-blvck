/**
 * Lead Detail Modal Component
 *
 * Shows complete information about a lead in a modal dialog
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import type { Lead } from '../hooks/use-leads';
import { IntentBadge } from './intent-badge';

interface LeadDetailModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailModal({ lead, open, onOpenChange }: LeadDetailModalProps) {
  if (!lead) return null;

  const fullName = lead.enrichedData
    ? `${lead.enrichedData.firstName || ''} ${lead.enrichedData.lastName || ''}`.trim()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[95vw] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white p-4 sm:p-6'>
        <DialogHeader>
          <DialogTitle className='text-xl sm:text-2xl text-white'>Detalhes do Lead</DialogTitle>
          <DialogDescription className='text-sm sm:text-base text-zinc-400'>
            Informações completas e classificação por IA
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 sm:space-y-6 mt-4'>
          {/* Basic Information */}
          <div>
            <h3 className='text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3'>
              Informações Básicas
            </h3>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
              <div>
                <p className='text-sm text-zinc-400 mb-1'>Email</p>
                <p className='text-white font-medium'>{lead.email}</p>
                {lead.enrichedData?.verified && (
                  <Badge
                    variant='secondary'
                    className='mt-1 bg-green-500/20 text-green-400 border-green-500/50'
                  >
                    ⨀ Verificado
                  </Badge>
                )}
              </div>
              <div>
                <p className='text-sm text-zinc-400 mb-1'>Fonte</p>
                <p className='text-white font-medium'>{lead.source}</p>
              </div>
              <div>
                <p className='text-sm text-zinc-400 mb-1'>Status</p>
                <Badge
                  className={
                    lead.status === 'processed'
                      ? 'bg-green-500/20 text-green-400 border-green-500/50'
                      : lead.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                        : lead.status === 'failed'
                          ? 'bg-red-500/20 text-red-400 border-red-500/50'
                          : 'bg-zinc-700 text-zinc-300'
                  }
                >
                  {lead.status}
                </Badge>
              </div>
              <div>
                <p className='text-sm text-zinc-400 mb-1'>Data de Criação</p>
                <p className='text-white font-medium'>
                  {new Date(lead.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          <Separator className='bg-zinc-800' />

          {/* Enriched Data */}
          {lead.enrichedData && (
            <div>
              <h3 className='text-lg font-semibold text-white mb-3'>
                Dados Enriquecidos (Hunter.io)
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                {fullName && (
                  <div>
                    <p className='text-sm text-zinc-400 mb-1'>Nome Completo</p>
                    <p className='text-white font-medium'>{fullName}</p>
                  </div>
                )}
                {lead.enrichedData.company && (
                  <div>
                    <p className='text-sm text-zinc-400 mb-1'>Empresa</p>
                    <p className='text-white font-medium'>{lead.enrichedData.company}</p>
                  </div>
                )}
                {lead.enrichedData.position && (
                  <div>
                    <p className='text-sm text-zinc-400 mb-1'>Cargo</p>
                    <p className='text-white font-medium'>{lead.enrichedData.position}</p>
                  </div>
                )}
                {lead.enrichedData.phone && (
                  <div>
                    <p className='text-sm text-zinc-400 mb-1'>Telefone</p>
                    <p className='text-white font-medium'>{lead.enrichedData.phone}</p>
                  </div>
                )}
                {lead.enrichedData.linkedin && (
                  <div className='col-span-1 sm:col-span-2'>
                    <p className='text-sm text-zinc-400 mb-1'>LinkedIn</p>
                    <a
                      href={lead.enrichedData.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-orange-500 hover:text-orange-400 underline break-all'
                    >
                      {lead.enrichedData.linkedin}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Classification */}
          {lead.aiClassification && (
            <>
              <Separator className='bg-zinc-800' />
              <div>
                <h3 className='text-lg font-semibold text-white mb-3'>Classificação por IA</h3>
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <p className='text-sm text-zinc-400 w-24'>Intenção:</p>
                    <IntentBadge
                      intent={lead.aiClassification.intent}
                      confidence={lead.aiClassification.confidence}
                    />
                  </div>
                  <div className='flex items-center gap-3'>
                    <p className='text-sm text-zinc-400 w-24'>Confiança:</p>
                    <p className='text-white font-medium'>
                      {Math.round(lead.aiClassification.confidence * 100)}%
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <p className='text-sm text-zinc-400 w-24'>Modelo:</p>
                    <Badge variant='outline' className='bg-zinc-800 border-zinc-700 text-zinc-300'>
                      {lead.aiClassification.model}
                    </Badge>
                  </div>
                  {lead.aiClassification.reasoning && (
                    <div>
                      <p className='text-sm text-zinc-400 mb-2'>Raciocínio:</p>
                      <p className='text-zinc-300 text-sm bg-zinc-800/50 p-3 rounded border border-zinc-700'>
                        {lead.aiClassification.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Raw Message */}
          {lead.rawMessage && (
            <>
              <Separator className='bg-zinc-800' />
              <div>
                <h3 className='text-lg font-semibold text-white mb-3'>Mensagem Original</h3>
                <p className='text-zinc-300 text-sm bg-zinc-800/50 p-3 rounded border border-zinc-700 whitespace-pre-wrap'>
                  {lead.rawMessage}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
