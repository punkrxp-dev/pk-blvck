import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  totalLeads: number;
  conversionRate: number;
  isLoading?: boolean;
}

export function DashboardHeader({ totalLeads, conversionRate, isLoading }: DashboardHeaderProps) {
  return (
    <div className='relative w-full py-8 md:py-12 mb-8 flex flex-col md:flex-row items-center justify-between border-b border-punk-steel/10 bg-punk-base'>
      {/* LEFT KPI (LEADS) */}
      <div className='flex-1 flex flex-col items-center md:items-start pl-0 md:pl-12 mb-6 md:mb-0'>
        <h1 className='sr-only'>Dashboard de Gestão PUNK | BLVCK</h1>
        <span className='text-punk-steel/40 text-xs font-mono tracking-widest uppercase mb-1'>
          Total Leads
        </span>
        <div className='text-6xl md:text-8xl font-industrial font-bold text-white leading-none tracking-tighter'>
          {totalLeads}
        </div>
      </div>

      {/* CENTER LOGO (THE PLATE) */}
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10'>
        <div className='relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center'>
          {/* PULSING GLOW BEHIND */}
          {isLoading && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className='absolute inset-0 bg-punk-neon rounded-full blur-xl'
            />
          )}

          {/* THE PLATE (Logo Container) */}
          <div className='w-20 h-20 md:w-24 md:h-24 bg-punk-plate rounded-full border-4 border-punk-steel/20 flex items-center justify-center shadow-lg shadow-black/50 z-20 overflow-hidden'>
            {/* Logo Image */}
            <img
              src='/favicon.svg'
              alt='PUNK | BLVCK Logo'
              className='w-full h-full object-contain p-2'
            />
          </div>

          {/* HEARTBEAT EFFECT (Iron Heart) */}
          {isLoading && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              className='absolute inset-0 border-2 border-punk-neon/30 rounded-full'
            />
          )}
        </div>
      </div>

      {/* RIGHT KPI (CONVERSION - MOCK) */}
      <div className='flex-1 flex flex-col items-center md:items-end pr-0 md:pr-12 mt-6 md:mt-0'>
        <span className='text-punk-steel/40 text-xs font-mono tracking-widest uppercase mb-1'>
          Conv. Rate
        </span>
        <div className='flex items-baseline'>
          <span className='text-6xl md:text-8xl font-industrial font-bold text-punk-neon leading-none tracking-tighter'>
            {conversionRate}
          </span>
          <span className='text-2xl font-industrial text-punk-neon/50 ml-1'>%</span>
        </div>
      </div>
    </div>
  );
}
