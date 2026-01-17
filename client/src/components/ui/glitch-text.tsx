import { motion } from 'framer-motion';
import { useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className = '' }: GlitchTextProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role='text'
      aria-label={text}
    >
      <span className='relative z-10'>{text}</span>
      {isHovered && (
        <>
          <motion.span
            className='absolute top-0 left-0 -z-10 text-punk-neon opacity-70'
            // Glitch animation channel 1 (Red/Orange)
            animate={{
              x: [-2, 2, -1, 0],
              y: [1, -1, 0],
              clipPath: ['inset(10% 0 80% 0)', 'inset(30% 0 10% 0)', 'inset(80% 0 5% 0)'],
            }}
            transition={{ repeat: Infinity, duration: 0.2, ease: 'linear' }}
          >
            {text}
          </motion.span>
          <motion.span
            className='absolute top-0 left-0 -z-10 text-cyan-400 opacity-70 mix-blend-screen'
            // Glitch animation channel 2 (Cyan/Blue)
            animate={{
              x: [2, -2, 1, 0],
              y: [-1, 1, 0],
              clipPath: ['inset(10% 0 60% 0)', 'inset(80% 0 5% 0)', 'inset(30% 0 20% 0)'],
            }}
            transition={{ repeat: Infinity, duration: 0.2, delay: 0.05, ease: 'linear' }}
          >
            {text}
          </motion.span>
        </>
      )}
    </div>
  );
}
