/**
 * Lead Filters Component
 *
 * Visual filter dropdowns for filtering leads by status, intent, and date range
 */

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X } from 'lucide-react';

export interface LeadFilters {
  status: string;
  intent: string;
  dateRange: string;
}

interface LeadFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
}

export function LeadFiltersComponent({ filters, onFiltersChange }: LeadFiltersProps) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters);

  const handleFilterChange = (key: keyof LeadFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: LeadFilters = {
      status: 'all',
      intent: 'all',
      dateRange: 'all',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount =
    (localFilters.status !== 'all' ? 1 : 0) +
    (localFilters.intent !== 'all' ? 1 : 0) +
    (localFilters.dateRange !== 'all' ? 1 : 0);

  return (
    <div className='flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg'>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-zinc-400'>Filtros:</span>
        {activeFiltersCount > 0 && (
          <Badge
            variant='secondary'
            className='bg-orange-500/20 text-orange-400 border-orange-500/50'
          >
            {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Select
        value={localFilters.status}
        onValueChange={value => handleFilterChange('status', value)}
      >
        <SelectTrigger className='w-[140px] bg-zinc-800 border-zinc-700 text-white'>
          <SelectValue placeholder='Status' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Todos</SelectItem>
          <SelectItem value='pending'>Pendente</SelectItem>
          <SelectItem value='processed'>Processado</SelectItem>
          <SelectItem value='notified'>Notificado</SelectItem>
          <SelectItem value='failed'>Falhou</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={localFilters.intent}
        onValueChange={value => handleFilterChange('intent', value)}
      >
        <SelectTrigger className='w-[140px] bg-zinc-800 border-zinc-700 text-white'>
          <SelectValue placeholder='Intenção' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Todas</SelectItem>
          <SelectItem value='high'>🔥 Alta</SelectItem>
          <SelectItem value='medium'>📊 Média</SelectItem>
          <SelectItem value='low'>📝 Baixa</SelectItem>
          <SelectItem value='spam'>🚫 Spam</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={localFilters.dateRange}
        onValueChange={value => handleFilterChange('dateRange', value)}
      >
        <SelectTrigger className='w-[140px] bg-zinc-800 border-zinc-700 text-white'>
          <SelectValue placeholder='Período' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Todos</SelectItem>
          <SelectItem value='today'>Hoje</SelectItem>
          <SelectItem value='week'>Esta Semana</SelectItem>
          <SelectItem value='month'>Este Mês</SelectItem>
        </SelectContent>
      </Select>

      {activeFiltersCount > 0 && (
        <Button
          variant='ghost'
          size='sm'
          onClick={clearFilters}
          className='text-zinc-400 hover:text-white'
        >
          <X className='h-4 w-4 mr-1' />
          Limpar
        </Button>
      )}
    </div>
  );
}
