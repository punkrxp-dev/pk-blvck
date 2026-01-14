/**
 * CSV Export Utility
 * 
 * Converts leads data to CSV format and triggers download
 */

import type { Lead } from '../hooks/use-leads';

/**
 * Escapes CSV field values
 */
function escapeCSVField(value: string | null | undefined): string {
  if (!value) return '';
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Formats date to readable format
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gets intent label in Portuguese
 */
function getIntentLabel(intent: string | undefined): string {
  const labels: Record<string, string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
    spam: 'Spam',
  };
  return labels[intent || ''] || '-';
}

/**
 * Gets status label in Portuguese
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    processed: 'Processado',
    notified: 'Notificado',
    failed: 'Falhou',
  };
  return labels[status] || status;
}

/**
 * Exports leads to CSV file
 */
export function exportLeadsToCSV(leads: Lead[], filename: string = 'leads.csv'): void {
  if (leads.length === 0) {
    alert('Nenhum lead para exportar');
    return;
  }

  // CSV Headers
  const headers = [
    'Email',
    'Nome Completo',
    'Empresa',
    'Cargo',
    'Telefone',
    'LinkedIn',
    'Intenção',
    'Confiança (%)',
    'Status',
    'Data de Criação',
    'Fonte',
  ];

  // Build CSV rows
  const rows = leads.map((lead) => {
    const fullName = lead.enrichedData
      ? `${lead.enrichedData.firstName || ''} ${lead.enrichedData.lastName || ''}`.trim()
      : '';

    return [
      escapeCSVField(lead.email),
      escapeCSVField(fullName || '-'),
      escapeCSVField(lead.enrichedData?.company || '-'),
      escapeCSVField(lead.enrichedData?.position || '-'),
      escapeCSVField(lead.enrichedData?.phone || '-'),
      escapeCSVField(lead.enrichedData?.linkedin || '-'),
      escapeCSVField(getIntentLabel(lead.aiClassification?.intent)),
      lead.aiClassification?.confidence
        ? Math.round(lead.aiClassification.confidence * 100).toString()
        : '-',
      escapeCSVField(getStatusLabel(lead.status)),
      escapeCSVField(formatDate(lead.createdAt)),
      escapeCSVField(lead.source),
    ];
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
