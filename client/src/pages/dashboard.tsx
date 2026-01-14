/**
 * Dashboard Page - Punk Black Aesthetic
 *
 * Lead management dashboard with real-time updates
 * Aesthetic: Dark background with neon orange accents
 */

import { useState } from 'react';
import { useLeads, type Lead } from '../hooks/use-leads';
import { Skeleton } from '../components/ui/skeleton';
import { LeadFiltersComponent, type LeadFilters } from '../components/lead-filters';
import { LeadDetailModal } from '../components/lead-detail-modal';
import { LeadActions } from '../components/lead-actions';
import { IntentBadge } from '../components/intent-badge';
import { exportLeadsToCSV } from '../utils/csv-export';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../components/ui/pagination';
import { Button } from '../components/ui/button';
import { Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

// ========================================
// LOGO COMPONENT
// ========================================

function PunkBlackLogo() {
  return (
    <div className='flex items-center gap-2 sm:gap-3'>
      <div className='relative'>
        <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25'>
          <div className='text-black font-bold text-lg sm:text-xl font-mono'>PB</div>
        </div>
        <div className='absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-zinc-950 rounded-full border-2 border-orange-500 flex items-center justify-center'>
          <span className='text-orange-500 text-[10px] sm:text-xs font-bold'>⚡</span>
        </div>
      </div>
      <div>
        <h1 className='text-lg sm:text-2xl font-bold text-white'>
          <span className='text-orange-500'>PUNK</span> | BLVCK
        </h1>
        <p className='text-[10px] sm:text-xs text-zinc-400 hidden sm:block'>
          High-end fitness system
        </p>
      </div>
    </div>
  );
}

// ========================================
// FOOTER COMPONENT
// ========================================

function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='mt-8 sm:mt-16 py-4 sm:py-8 border-t border-zinc-800/50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-8'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4'>
          <div className='flex items-center gap-2 sm:gap-4'>
            <PunkBlackLogo />
          </div>
          <div className='flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm text-zinc-400'>
            <span>© {currentYear} PUNK | BLVCK</span>
            <span className='hidden sm:inline'>•</span>
            <span className='hidden sm:inline'>Built with NEØ Protocol</span>
            <span className='hidden sm:inline'>•</span>
            <span>v2.0.0</span>
          </div>
          <div className='flex items-center gap-2 sm:gap-4'>
            <div className='flex items-center gap-2 px-2 sm:px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span className='text-[10px] sm:text-xs text-zinc-400'>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ========================================
// SORTABLE TABLE HEADER
// ========================================

interface SortableHeaderProps {
  field: string;
  currentSort: { field: string; order: 'asc' | 'desc' };
  onSort: (field: string) => void;
  children: React.ReactNode;
}

function SortableHeader({ field, currentSort, onSort, children }: SortableHeaderProps) {
  const isActive = currentSort.field === field;
  const Icon = isActive ? (currentSort.order === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className='px-3 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors'
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-1 sm:gap-2'>
        {children}
        <Icon
          className={`h-3 w-3 sm:h-4 sm:w-4 ${isActive ? 'text-orange-500' : 'text-zinc-500'}`}
        />
      </div>
    </th>
  );
}

// ========================================
// KPI CARD COMPONENT
// ========================================

interface KPICardProps {
  title: string;
  value: number | string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: 'orange' | 'blue' | 'green' | 'red';
}

function KPICard({ title, value, icon, accentColor = 'orange' }: KPICardProps) {
  const accentStyles = {
    orange: 'border-orange-500/30 shadow-orange-500/10',
    blue: 'border-blue-500/30 shadow-blue-500/10',
    green: 'border-green-500/30 shadow-green-500/10',
    red: 'border-red-500/30 shadow-red-500/10',
  };

  const textStyles = {
    orange: 'text-orange-500',
    blue: 'text-blue-400',
    green: 'text-green-400',
    red: 'text-red-400',
  };

  return (
    <div
      className={`bg-zinc-900/50 backdrop-blur-sm border rounded-lg p-4 sm:p-6 shadow-lg ${accentStyles[accentColor]}`}
    >
      <div className='flex items-center justify-between mb-2'>
        <p className='text-xs sm:text-sm font-medium text-zinc-400'>{title}</p>
        {icon && <span className='text-xl sm:text-2xl'>{icon}</span>}
      </div>
      <p className={`text-2xl sm:text-3xl font-bold ${textStyles[accentColor]}`}>{value}</p>
    </div>
  );
}

// ========================================
// LOADING SKELETON
// ========================================

function DashboardSkeleton() {
  return (
    <div className='space-y-6'>
      {/* KPI Cards Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className='h-32 bg-zinc-900/50' />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className='bg-zinc-900/50 border border-zinc-800 rounded-lg p-6'>
        <Skeleton className='h-8 w-48 mb-6 bg-zinc-800' />
        <div className='space-y-3'>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className='h-16 bg-zinc-800' />
          ))}
        </div>
      </div>
    </div>
  );
}

// ========================================
// MAIN DASHBOARD COMPONENT
// ========================================

export default function Dashboard() {
  const [filters, setFilters] = useState<LeadFilters>({
    status: 'all',
    intent: 'all',
    dateRange: 'all',
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortState, setSortState] = useState<{ field: string; order: 'asc' | 'desc' }>({
    field: 'createdAt',
    order: 'desc',
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSort = (field: string) => {
    setSortState(prev => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFiltersChange = (newFilters: LeadFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const { data, isLoading, error, isRefetching } = useLeads({
    status: filters.status !== 'all' ? filters.status : undefined,
    intent: filters.intent !== 'all' ? filters.intent : undefined,
    page,
    pageSize,
    sortBy: sortState.field,
    sortOrder: sortState.order,
  });

  if (error) {
    return (
      <div className='min-h-screen bg-zinc-950 text-white p-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-500/10 border border-red-500/50 rounded-lg p-6'>
            <h2 className='text-xl font-bold text-red-400 mb-2'>❌ Erro ao carregar leads</h2>
            <p className='text-red-300'>
              {error instanceof Error ? error.message : 'Erro desconhecido'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-zinc-950 text-white p-8'>
        <div className='max-w-7xl mx-auto'>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    spam: 0,
    processedToday: 0,
  };

  const leads = data?.data || [];
  const pagination = data?.meta?.pagination;

  const handleExportCSV = () => {
    exportLeadsToCSV(leads, `leads-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-white p-4 sm:p-6 lg:p-8'>
      <div className='max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <PunkBlackLogo />

          {/* Live Indicator */}
          <div className='flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg w-full sm:w-auto'>
            <div
              className={`w-2 h-2 rounded-full ${isRefetching ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}
            />
            <span className='text-xs sm:text-sm text-zinc-400'>
              {isRefetching ? 'Atualizando...' : 'Ao vivo'}
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <KPICard title='Total de Leads' value={stats.total} icon='📊' accentColor='blue' />
          <KPICard title='Alta Intenção' value={stats.high} icon='🔥' accentColor='orange' />
          <KPICard
            title='Processados Hoje'
            value={stats.processedToday}
            icon='✅'
            accentColor='green'
          />
          <KPICard title='Spam Detectado' value={stats.spam} icon='🚫' accentColor='red' />
        </div>

        {/* Integrations Status */}
        <div className='bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-4 sm:p-6 shadow-lg'>
          <h2 className='text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4'>
            🤖 Integrações Ativas
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4'>
            <div className='flex items-start gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/70 transition-colors'>
              <div className='w-10 h-10 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-green-400 text-sm font-bold'>✓</span>
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-white'>OpenAI GPT-4o</p>
                <p className='text-xs text-zinc-400 leading-tight'>
                  Classifica leads por intenção (alta/média/baixa/spam) usando IA avançada
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/70 transition-colors'>
              <div className='w-10 h-10 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-blue-400 text-sm font-bold'>G</span>
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-white'>Google Gemini</p>
                <p className='text-xs text-zinc-400 leading-tight'>
                  Backup automático quando OpenAI indisponível ou sem quota
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/70 transition-colors'>
              <div className='w-10 h-10 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-purple-400 text-sm font-bold'>H</span>
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-white'>Hunter.io</p>
                <p className='text-xs text-zinc-400 leading-tight'>
                  Enriquece dados: nome completo, empresa, cargo, domínio profissional
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/70 transition-colors'>
              <div className='w-10 h-10 bg-orange-500/20 border border-orange-500/50 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-orange-400 text-sm font-bold'>R</span>
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-white'>Resend</p>
                <p className='text-xs text-zinc-400 leading-tight'>
                  Envia notificações automáticas por email para leads qualificados
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-800/70 transition-colors'>
              <div className='w-10 h-10 bg-cyan-500/20 border border-cyan-500/50 rounded-full flex items-center justify-center flex-shrink-0'>
                <span className='text-cyan-400 text-sm font-bold'>N</span>
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-white'>Neon Postgres</p>
                <p className='text-xs text-zinc-400 leading-tight'>
                  Banco de dados PostgreSQL gerenciado na nuvem com Drizzle ORM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Intent Distribution */}
        <div className='bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-4 sm:p-6 shadow-lg'>
          <h2 className='text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4'>
            Distribuição de Intenção
          </h2>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-orange-500'>{stats.high}</p>
              <p className='text-sm text-zinc-400'>Alta</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-400'>{stats.medium}</p>
              <p className='text-sm text-zinc-400'>Média</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-gray-400'>{stats.low}</p>
              <p className='text-sm text-zinc-400'>Baixa</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-red-400'>{stats.spam}</p>
              <p className='text-sm text-zinc-400'>Spam</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <LeadFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Leads Table */}
        <div className='bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-lg overflow-hidden'>
          <div className='p-4 sm:p-6 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0'>
            <div>
              <h2 className='text-lg sm:text-xl font-bold text-white'>Leads</h2>
              <p className='text-xs sm:text-sm text-zinc-400 mt-1'>
                {pagination
                  ? `Mostrando ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )} de ${pagination.total} leads`
                  : `Últimos ${leads.length} leads capturados`}
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              variant='outline'
              size='sm'
              className='bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 w-full sm:w-auto'
            >
              <Download className='h-4 w-4 sm:mr-2' />
              <span className='hidden sm:inline'>Exportar CSV</span>
              <span className='sm:hidden'>CSV</span>
            </Button>
          </div>

          {leads.length === 0 ? (
            <div className='p-12 text-center'>
              <p className='text-zinc-500 text-lg'>Nenhum lead encontrado</p>
              <p className='text-zinc-600 text-sm mt-2'>
                Leads aparecerão aqui quando forem processados
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto -mx-4 sm:mx-0'>
              <table className='w-full min-w-[640px]'>
                <thead className='bg-zinc-900/80'>
                  <tr className='border-b border-zinc-800'>
                    <SortableHeader field='email' currentSort={sortState} onSort={handleSort}>
                      Email
                    </SortableHeader>
                    <th className='px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell'>
                      Empresa
                    </th>
                    <th className='px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell'>
                      Cargo
                    </th>
                    <SortableHeader field='intent' currentSort={sortState} onSort={handleSort}>
                      Intenção
                    </SortableHeader>
                    <SortableHeader field='status' currentSort={sortState} onSort={handleSort}>
                      Status
                    </SortableHeader>
                    <SortableHeader field='createdAt' currentSort={sortState} onSort={handleSort}>
                      Data
                    </SortableHeader>
                    <th className='px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider w-12'>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-zinc-800'>
                  {leads.map((lead: Lead) => (
                    <tr
                      key={lead.id}
                      className='hover:bg-zinc-800/50 transition-colors cursor-pointer'
                      onClick={() => handleRowClick(lead)}
                    >
                      <td className='px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium text-white'>{lead.email}</span>
                          {lead.enrichedData?.verified && (
                            <span className='text-green-500' title='Email verificado'>
                              ✓
                            </span>
                          )}
                        </div>
                        {lead.enrichedData?.firstName && (
                          <p className='text-xs text-zinc-500 mt-1'>
                            {lead.enrichedData.firstName} {lead.enrichedData.lastName}
                          </p>
                        )}
                        {lead.enrichedData?.company && (
                          <p className='text-xs text-zinc-500 mt-1 sm:hidden'>
                            {lead.enrichedData.company}
                          </p>
                        )}
                      </td>
                      <td className='px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell'>
                        <span className='text-sm text-zinc-300'>
                          {lead.enrichedData?.company || '-'}
                        </span>
                      </td>
                      <td className='px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell'>
                        <span className='text-sm text-zinc-300'>
                          {lead.enrichedData?.position || '-'}
                        </span>
                      </td>
                      <td className='px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap'>
                        {lead.aiClassification ? (
                          <IntentBadge
                            intent={lead.aiClassification.intent}
                            confidence={lead.aiClassification.confidence}
                          />
                        ) : (
                          <span className='text-sm text-zinc-500'>-</span>
                        )}
                      </td>
                      <td className='px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            lead.status === 'processed'
                              ? 'bg-green-500/20 text-green-400'
                              : lead.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : lead.status === 'failed'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className='px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-zinc-400'>
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td
                        className='px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap'
                        onClick={e => e.stopPropagation()}
                      >
                        <LeadActions lead={lead} onViewDetails={() => handleRowClick(lead)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className='p-4 sm:p-6 border-t border-zinc-800'>
              <Pagination>
                <PaginationContent className='flex-wrap gap-1 sm:gap-2'>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={
                        page === 1
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer text-white hover:text-orange-500 text-xs sm:text-sm'
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (page <= 2) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 1) {
                      pageNum = pagination.totalPages - 2 + i;
                    } else {
                      pageNum = page - 1 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setPage(pageNum)}
                          isActive={page === pageNum}
                          className='cursor-pointer text-white hover:text-orange-500 text-xs sm:text-sm min-w-[32px] sm:min-w-[40px]'
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  {pagination.totalPages > 3 && (
                    <>
                      <PaginationEllipsis className='hidden sm:flex' />
                      <PaginationItem className='hidden sm:list-item'>
                        <PaginationLink
                          onClick={() => setPage(pagination.totalPages)}
                          isActive={page === pagination.totalPages}
                          className='cursor-pointer text-white hover:text-orange-500'
                        >
                          {pagination.totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      className={
                        page === pagination.totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer text-white hover:text-orange-500 text-xs sm:text-sm'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* Lead Detail Modal */}
        <LeadDetailModal lead={selectedLead} open={modalOpen} onOpenChange={setModalOpen} />

        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
}
