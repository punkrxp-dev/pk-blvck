import { motion } from 'framer-motion';

interface FooterProps {
    variant?: 'landing' | 'dashboard';
}

export function Footer({ variant = 'landing' }: FooterProps) {
    const currentYear = new Date().getFullYear();

    if (variant === 'dashboard') {
        return (
            <footer className='mt-16 py-8 border-t border-punk-steel/10'>
                <div className='max-width-[1400px] mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
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

                        <div className='flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500 font-mono uppercase tracking-wider'>
                            <span>© {currentYear} PUNK | BLVCK</span>
                            <span>•</span>
                            <a
                                href='https://www.instagram.com/neoflowoff.eth/'
                                target='_blank'
                                rel='noreferrer noopener'
                                className='hover:text-punk-neon transition-colors'
                            >
                                NEØ PROTOCOL v2.0
                            </a>
                        </div>

                        <div className='flex items-center gap-4'>
                            <div className='flex items-center gap-2 px-3 py-1 bg-zinc-900/50 border border-punk-steel/10 rounded-full'>
                                <div className='w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse'></div>
                                <span className='text-[10px] text-zinc-500 uppercase tracking-widest'>Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className='py-12 md:py-16 px-4 md:px-8 lg:px-16 border-t border-white/10'>
            <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-center'>
                <motion.span
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className='font-mono text-xs tracking-[0.2em] text-white/70 block'
                >
                    PUNK | BLVCK © {currentYear}
                </motion.span>

                <div className='flex justify-center'>
                    <a
                        href='https://www.instagram.com/punk.blvck'
                        target='_blank'
                        rel='noreferrer noopener'
                        className='group flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-white/60 hover:text-punk-neon transition-colors'
                    >
                        <span className='w-4 h-px bg-white/20 group-hover:bg-punk-neon transition-colors' />
                        INSTAGRAM / @PUNK.BLVCK
                    </a>
                </div>

                <span className='font-mono text-[10px] tracking-[0.2em] text-white/60 md:text-right uppercase'>
                    Presence is The New Power
                </span>
            </div>
        </footer>
    );
}
