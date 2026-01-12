/**
 * Dashboard Page - Punk Black Aesthetic
 * 
 * Lead management dashboard with real-time updates
 * Aesthetic: Dark background with neon orange accents
 */

import { useLeads, type Lead } from '../hooks/use-leads';
import { Skeleton } from '../components/ui/skeleton';

// ========================================
// INTENT BADGE COMPONENT
// ========================================

interface IntentBadgeProps {
    intent: 'high' | 'medium' | 'low' | 'spam';
    confidence?: number;
}

function IntentBadge({ intent, confidence }: IntentBadgeProps) {
    const styles = {
        high: 'bg-orange-500/20 text-orange-500 border-orange-500/50 shadow-orange-500/20',
        medium: 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-blue-500/20',
        low: 'bg-gray-500/20 text-gray-400 border-gray-500/50 shadow-gray-500/20',
        spam: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-red-500/20',
    };

    const labels = {
        high: '🔥 Alta',
        medium: '📊 Média',
        low: '📝 Baixa',
        spam: '🚫 Spam',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${styles[intent]}`}
        >
            {labels[intent]}
            {confidence && (
                <span className="opacity-70">
                    {Math.round(confidence * 100)}%
                </span>
            )}
        </span>
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
            className={`bg-zinc-900/50 backdrop-blur-sm border rounded-lg p-6 shadow-lg ${accentStyles[accentColor]}`}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-zinc-400">{title}</p>
                {icon && <span className="text-2xl">{icon}</span>}
            </div>
            <p className={`text-3xl font-bold ${textStyles[accentColor]}`}>
                {value}
            </p>
        </div>
    );
}

// ========================================
// LOADING SKELETON
// ========================================

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 bg-zinc-900/50" />
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <Skeleton className="h-8 w-48 mb-6 bg-zinc-800" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-16 bg-zinc-800" />
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
    const { data, isLoading, error, isRefetching } = useLeads();

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-red-400 mb-2">
                            ❌ Erro ao carregar leads
                        </h2>
                        <p className="text-red-300">
                            {error instanceof Error ? error.message : 'Erro desconhecido'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white p-8">
                <div className="max-w-7xl mx-auto">
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

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                            🎸 Dashboard <span className="text-orange-500">Heavy Metal</span>
                        </h1>
                        <p className="text-zinc-400">
                            Monitoramento de leads em tempo real
                        </p>
                    </div>

                    {/* Live Indicator */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${isRefetching ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-sm text-zinc-400">
                            {isRefetching ? 'Atualizando...' : 'Ao vivo'}
                        </span>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Total de Leads"
                        value={stats.total}
                        icon="📊"
                        accentColor="blue"
                    />
                    <KPICard
                        title="Alta Intenção"
                        value={stats.high}
                        icon="🔥"
                        accentColor="orange"
                    />
                    <KPICard
                        title="Processados Hoje"
                        value={stats.processedToday}
                        icon="✅"
                        accentColor="green"
                    />
                    <KPICard
                        title="Spam Detectado"
                        value={stats.spam}
                        icon="🚫"
                        accentColor="red"
                    />
                </div>

                {/* Intent Distribution */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Distribuição de Intenção
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-500">{stats.high}</p>
                            <p className="text-sm text-zinc-400">Alta</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{stats.medium}</p>
                            <p className="text-sm text-zinc-400">Média</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-400">{stats.low}</p>
                            <p className="text-sm text-zinc-400">Baixa</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-400">{stats.spam}</p>
                            <p className="text-sm text-zinc-400">Spam</p>
                        </div>
                    </div>
                </div>

                {/* Leads Table */}
                <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <h2 className="text-xl font-bold text-white">
                            Leads Recentes
                        </h2>
                        <p className="text-sm text-zinc-400 mt-1">
                            Últimos {leads.length} leads capturados
                        </p>
                    </div>

                    {leads.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-zinc-500 text-lg">
                                Nenhum lead encontrado
                            </p>
                            <p className="text-zinc-600 text-sm mt-2">
                                Leads aparecerão aqui quando forem processados
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-zinc-900/80">
                                    <tr className="border-b border-zinc-800">
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                            Empresa
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                            Cargo
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                            Intenção
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                            Data
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {leads.map((lead: Lead) => (
                                        <tr
                                            key={lead.id}
                                            className="hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-white">
                                                        {lead.email}
                                                    </span>
                                                    {lead.enrichedData?.verified && (
                                                        <span className="text-green-500" title="Email verificado">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                                {lead.enrichedData?.firstName && (
                                                    <p className="text-xs text-zinc-500 mt-1">
                                                        {lead.enrichedData.firstName} {lead.enrichedData.lastName}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-zinc-300">
                                                    {lead.enrichedData?.company || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-zinc-300">
                                                    {lead.enrichedData?.position || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {lead.aiClassification ? (
                                                    <IntentBadge
                                                        intent={lead.aiClassification.intent}
                                                        confidence={lead.aiClassification.confidence}
                                                    />
                                                ) : (
                                                    <span className="text-sm text-zinc-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${lead.status === 'processed'
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                                {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
