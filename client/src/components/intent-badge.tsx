/**
 * Intent Badge Component
 * 
 * Reusable badge component for displaying lead intent
 */

interface IntentBadgeProps {
  intent: 'high' | 'medium' | 'low' | 'spam';
  confidence?: number;
}

export function IntentBadge({ intent, confidence }: IntentBadgeProps) {
  const styles = {
    high: 'bg-orange-500/20 text-orange-500 border-orange-500/50 shadow-orange-500/20',
    medium: 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-blue-500/20',
    low: 'bg-gray-500/20 text-gray-400 border-gray-500/50 shadow-gray-500/20',
    spam: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-red-500/20',
  };

  const labels = {
    high: '⍟ Alta',
    medium: '⧉ Média',
    low: '◬ Baixa',
    spam: '⨂ Spam',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${styles[intent]}`}
    >
      {labels[intent]}
      {confidence && <span className='opacity-70'>{Math.round(confidence * 100)}%</span>}
    </span>
  );
}
