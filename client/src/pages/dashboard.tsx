/**
 * Dashboard Page - Punk Black Aesthetic (Industrial/Underground)
 */

import { useState } from 'react';
import { useLeads, type Lead } from '../hooks/use-leads';
import { Skeleton } from '../components/ui/skeleton';
import { LeadFiltersComponent, type LeadFilters } from '../components/dashboard/lead-filters';
import { LeadDetailModal } from '../components/dashboard/lead-detail-modal';
import { LeadActions } from '../components/dashboard/lead-actions';
import { IntentBadge } from '../components/dashboard/intent-badge';
import { exportLeadsToCSV } from '../lib/csv-export';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/pagination';
import { Button } from '../components/ui/button';
import { Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DashboardHeader } from '../components/dashboard/dashboard-header';

// ========================================
// LOGO COMPONENT (Footer version)
// ========================================

function PunkBlackLogoSmall() {
  return (
    <div className='flex items-center gap-2'>
      <div className='w-8 h-8 bg-punk-plate rounded border border-punk-steel/20 flex items-center justify-center overflow-hidden'>
        <img
          src='/favicon.svg'
          alt='PUNK | BLVCK Logo'
          className='w-full h-full object-contain p-1'
        />
      </div>
      <span className='text-lg font-industrial font-bold text-white tracking-widest'>
        PUNK<span className='text-punk-neon'>|</span>BLVCK
      </span>
    </div>
  );
}

// ========================================
// FOOTER COMPONENT
// ========================================

function DashboardFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='mt-16 py-8 border-t border-punk-steel/10'>
      <div className='max-w-7xl mx-auto px-8'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
          <div className='flex items-center gap-4'>
            <PunkBlackLogoSmall />
          </div>
          <div className='flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 font-mono uppercase tracking-wider'>
            <span>© {currentYear} INDUSTRIAL SYSTEMS</span>
            <span>•</span>
            <span>NEØ PROTOCOL v2.0</span>
          </div>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2 px-3 py-1 bg-punk-plate border border-punk-steel/10 rounded-full'>
              <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse'></div>
              <span className='text-[10px] text-zinc-500 uppercase tracking-widest'>Online</span>
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
      className='px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono cursor-pointer hover:text-punk-neon transition-colors'
      onClick={() => onSort(field)}
    >
      <div className='flex items-center gap-2'>
        {children}
        <Icon className={`h-3 w-3 ${isActive ? 'text-punk-neon' : 'text-zinc-600'}`} />
      </div>
    </th>
  );
}

// ========================================
// LOADING SKELETON
// ========================================

function DashboardSkeleton() {
  return (
    <div className='min-h-screen bg-punk-base space-y-8 p-8'>
      <div className='h-40 w-full bg-punk-plate/50 animate-pulse rounded-lg border border-punk-steel/5' />

      <div className='grid grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className='h-24 bg-punk-plate/50 border border-punk-steel/5' />
        ))}
      </div>

      <div className='bg-punk-plate border border-punk-steel/10 rounded-lg p-6'>
        <div className='space-y-4'>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className='h-12 bg-zinc-900 border border-zinc-800' />
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
    setPage(1);
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
      <div className='min-h-screen bg-punk-base flex items-center justify-center'>
        <div className='text-red-500 font-mono'>SYSTEM ERROR: {error.message}</div>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = data?.stats || {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    spam: 0,
    processedToday: 0,
    conversionRate: 26, // Hardcoded MOCK as per design request
  };

  const leads = data?.data || [];
  const pagination = data?.meta?.pagination;

  const handleExportCSV = () => {
    exportLeadsToCSV(leads, `leads-industrial-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setModalOpen(true);
  };

  return (
    <div className='min-h-screen bg-punk-base text-white font-sans selection:bg-punk-neon selection:text-black'>
      {/* INDUSTRIAL HEADER */}
      <DashboardHeader
        totalLeads={stats.total}
        conversionRate={26} // Mock value requested
        isLoading={isRefetching}
      />

      <div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8'>
        {/* OPERATIONAL METRICS (Secondary Cards) */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {[
            { label: 'High Intent', value: stats.high, color: 'text-punk-neon' },
            { label: 'Medium', value: stats.medium, color: 'text-blue-400' },
            { label: 'Low', value: stats.low, color: 'text-zinc-500' },
            { label: 'Spam Blocked', value: stats.spam, color: 'text-red-500' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className='bg-punk-plate border border-punk-steel/10 p-4 rounded-sm hover:border-punk-neon/30 transition-colors group'
            >
              <p className='text-[10px] text-zinc-500 uppercase tracking-widest font-mono mb-1'>
                {stat.label}
              </p>
              <p
                className={`text-2xl font-industrial font-bold ${stat.color} group-hover:scale-105 transition-transform origin-left`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* FILTERS & ACTIONS */}
        <div className='flex flex-col space-y-4'>
          <LeadFiltersComponent filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        {/* DATA TABLE CONTAINER */}
        <div className='bg-punk-plate border border-punk-steel/10 rounded-sm overflow-hidden shadow-2xl shadow-black/50'>
          {/* Table Toolbar */}
          <div className='p-4 border-b border-punk-steel/5 flex justify-between items-center bg-zinc-900/50'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-punk-neon rounded-full' />
              <span className='text-xs font-mono text-zinc-400 uppercase tracking-wider'>
                Live Feed • {pagination?.total || 0} Records
              </span>
            </div>
            <Button
              onClick={handleExportCSV}
              variant='outline'
              size='sm'
              className='bg-transparent border-punk-steel/20 text-punk-steel/60 hover:text-punk-neon hover:border-punk-neon text-xs uppercase tracking-widest font-mono'
            >
              <Download className='h-3 w-3 mr-2' />
              Export CSV
            </Button>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-zinc-950/50'>
                <tr>
                  <SortableHeader field='email' currentSort={sortState} onSort={handleSort}>
                    Email / ID
                  </SortableHeader>
                  <th className='px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono hidden sm:table-cell'>
                    Company
                  </th>
                  <th className='px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono hidden md:table-cell'>
                    Role
                  </th>
                  <SortableHeader field='intent' currentSort={sortState} onSort={handleSort}>
                    Intent
                  </SortableHeader>
                  <SortableHeader field='status' currentSort={sortState} onSort={handleSort}>
                    Status
                  </SortableHeader>
                  <SortableHeader field='createdAt' currentSort={sortState} onSort={handleSort}>
                    Date
                  </SortableHeader>
                  <th className='w-12'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-punk-steel/5'>
                {leads.map((lead: Lead) => (
                  <tr
                    key={lead.id}
                    className='group hover:bg-punk-neon/5 transition-colors cursor-pointer'
                    onClick={() => handleRowClick(lead)}
                  >
                    <td className='px-6 py-4'>
                      <div className='flex flex-col'>
                        <div className='flex items-center gap-2'>
                          <span className='font-mono text-sm text-punk-steel group-hover:text-white transition-colors'>
                            {lead.email}
                          </span>
                          {lead.enrichedData?.verified && (
                            <span className='text-[10px] text-green-500' title='Verified'>
                              ✓
                            </span>
                          )}
                        </div>
                        {lead.enrichedData?.firstName && (
                          <span className='text-xs text-zinc-600 mt-1'>
                            {lead.enrichedData.firstName} {lead.enrichedData.lastName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 hidden sm:table-cell'>
                      <span className='text-sm text-zinc-400 font-mono'>
                        {lead.enrichedData?.company || '-'}
                      </span>
                    </td>
                    <td className='px-6 py-4 hidden md:table-cell'>
                      <span className='text-sm text-zinc-400'>
                        {lead.enrichedData?.position || '-'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      {lead.aiClassification && (
                        <IntentBadge
                          intent={lead.aiClassification.intent}
                          confidence={lead.aiClassification.confidence}
                        />
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-sm ${
                          lead.status === 'processed'
                            ? 'bg-green-500/10 text-green-500'
                            : lead.status === 'failed'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-xs text-zinc-600 font-mono'>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td
                      className='px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={e => e.stopPropagation()}
                    >
                      <LeadActions lead={lead} onViewDetails={() => handleRowClick(lead)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination && pagination.totalPages > 1 && (
            <div className='bg-zinc-950/30 border-t border-punk-steel/5 p-4 flex justify-center'>
              <Pagination>
                {/* Reuse existing pagination logic but simplified styling if needed */}
                <PaginationContent>
                  <PaginationPrevious
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className='text-zinc-500 hover:text-punk-neon cursor-pointer'
                  />
                  <PaginationItem>
                    <span className='text-xs text-zinc-600 font-mono mx-4'>
                      PAGE {page} / {pagination.totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationNext
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    className='text-zinc-500 hover:text-punk-neon cursor-pointer'
                  />
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        <LeadDetailModal lead={selectedLead} open={modalOpen} onOpenChange={setModalOpen} />
        <DashboardFooter />
      </div>
    </div>
  );
}
