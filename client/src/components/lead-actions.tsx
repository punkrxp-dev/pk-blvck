/**
 * Lead Actions Component
 *
 * Dropdown menu with quick actions for leads
 */

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { MoreVertical, Trash2, Mail, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Lead } from '../hooks/use-leads';

interface LeadActionsProps {
  lead: Lead;
  onViewDetails?: () => void;
}

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function updateLeadStatus(leadId: string, status: string) {
  const response = await fetch(`${apiBaseUrl}/api/mcp/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update status');
  return response.json();
}

async function markAsSpam(leadId: string) {
  const response = await fetch(`${apiBaseUrl}/api/mcp/leads/${leadId}/mark-spam`, {
    method: 'PATCH',
  });
  if (!response.ok) throw new Error('Failed to mark as spam');
  return response.json();
}

async function sendNotification(leadId: string) {
  const response = await fetch(`${apiBaseUrl}/api/mcp/leads/${leadId}/notify`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to send notification');
  return response.json();
}

async function deleteLead(leadId: string) {
  const response = await fetch(`${apiBaseUrl}/api/mcp/leads/${leadId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete lead');
  return response.json();
}

export function LeadActions({ lead, onViewDetails }: LeadActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => updateLeadStatus(lead.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Status atualizado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const markSpamMutation = useMutation({
    mutationFn: () => markAsSpam(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead marcado como spam');
    },
    onError: () => {
      toast.error('Erro ao marcar como spam');
    },
  });

  const notifyMutation = useMutation({
    mutationFn: () => sendNotification(lead.id),
    onSuccess: () => {
      toast.success('Notificação enviada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao enviar notificação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLead(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deletado com sucesso');
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error('Erro ao deletar lead');
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
            <MoreVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='bg-zinc-900 border-zinc-800'>
          {onViewDetails && (
            <DropdownMenuItem
              onClick={onViewDetails}
              className='text-white hover:bg-zinc-800 cursor-pointer'
            >
              <Eye className='mr-2 h-4 w-4' />
              Ver Detalhes
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => updateStatusMutation.mutate({ status: 'processed' })}
            disabled={lead.status === 'processed' || updateStatusMutation.isPending}
            className='text-white hover:bg-zinc-800 cursor-pointer'
          >
            <CheckCircle className='mr-2 h-4 w-4' />
            Marcar como Processado
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => markSpamMutation.mutate()}
            disabled={lead.aiClassification?.intent === 'spam' || markSpamMutation.isPending}
            className='text-white hover:bg-zinc-800 cursor-pointer'
          >
            <XCircle className='mr-2 h-4 w-4' />
            Marcar como Spam
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => notifyMutation.mutate()}
            disabled={notifyMutation.isPending}
            className='text-white hover:bg-zinc-800 cursor-pointer'
          >
            <Mail className='mr-2 h-4 w-4' />
            Reenviar Notificação
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className='text-red-400 hover:bg-red-500/10 cursor-pointer'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className='bg-zinc-900 border-zinc-800'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-white'>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className='text-zinc-400'>
              Tem certeza que deseja deletar o lead <strong>{lead.email}</strong>? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {deleteMutation.isPending ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
