import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';

export default function Landing() {
  return (
    <div className='min-h-screen bg-punk-base text-white overflow-x-hidden font-sans selection:bg-punk-neon selection:text-black'>
      <main>
        {/* Hero */}
        <section className='relative min-h-screen flex items-center justify-center px-4'>
          <div className='absolute inset-0 bg-linear-to-b from-black via-transparent to-black opacity-80' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)]' />

          <div className='relative z-10 max-w-3xl text-center'>
            <div className='flex items-center justify-center gap-4 mb-8'>
              <span className='w-8 h-px bg-white/40' />
              <span className='font-mono text-[10px] tracking-[0.2em] text-white/70'>
                Training. Strength. Conditioning.
              </span>
              <span className='w-8 h-px bg-white/40' />
            </div>

            <h1 className='text-3xl md:text-6xl font-industrial tracking-tighter text-white font-bold uppercase mb-6 leading-tight'>
              O treino não é objetivo.
              <br />
              É presença.
              <br />
              É transformação.
            </h1>

            <p className='text-sm md:text-base text-white/80 leading-relaxed mb-5'>
              Mais que um espaço de treino.
              <br />
              Um ecossistema de performance premium e convivência.
            </p>

            <p className='text-xs md:text-sm text-white/60 leading-relaxed mb-10'>
              Experiência além da repetição.
              <br />
              Cada detalhe do design, da energia e dos programas foi pensado para transformar presença em resultado palpável.
            </p>

            <div className='text-[10px] md:text-xs tracking-[0.3em] text-white/50 uppercase mb-4'>
              Registro necessário para acesso.
            </div>

            <WaitlistForm />
          </div>
        </section>

        {/* Programs */}
        <section className='py-20 md:py-28 px-4 md:px-8 lg:px-16'>
          <div className='max-w-6xl mx-auto'>
            <div className='flex items-center gap-4 mb-10 md:mb-16'>
              <span className='w-8 md:w-12 h-px bg-punk-neon' />
              <span className='font-mono text-[10px] md:text-xs tracking-[0.3em] text-white/70 italic'>SYSTEMS</span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10'>
              <div className='bg-black p-8 md:p-12'>
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>01</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-4 uppercase'>// training</h3>
                <p className='font-sans text-xs tracking-wider text-white/60 leading-relaxed uppercase'>
                  PERFORMANCE
                  <br />
                  OPTIMIZATION
                  <br />
                  PROTOCOL
                </p>
              </div>

              <div className='bg-black p-8 md:p-12'>
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>02</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-4 uppercase'>[zone]</h3>
                <p className='font-sans text-xs tracking-wider text-white/60 leading-relaxed uppercase'>
                  HIGH
                  <br />
                  INTENSITY
                  <br />
                  FRAMEWORK
                </p>
              </div>

              <div className='bg-black p-8 md:p-12'>
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>03</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-4 uppercase'>.yoga</h3>
                <p className='font-sans text-xs tracking-wider text-white/60 leading-relaxed uppercase'>
                  MOBILITY
                  <br />
                  RESTORATION
                  <br />
                  SEQUENCE
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Context */}
        <section className='py-16 md:py-20 px-4 md:px-8 lg:px-16'>
          <div className='max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6'>
            <span className='font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase'>
              Plaza D&apos;Oro Shopping // Goiânia - GO
            </span>
            <span className='font-mono text-[10px] tracking-[0.2em] text-white/30 uppercase'>
              Presence is The New Power
            </span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='py-12 md:py-16 px-4 md:px-8 lg:px-16 border-t border-white/10'>
        <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8'>
          <span className='font-mono text-xs tracking-[0.2em] text-white/70 block'>PUNK | BLVCK ©</span>
          <a
            href='https://www.instagram.com/punk.blvck'
            target='_blank'
            rel='noreferrer noopener'
            className='font-mono text-[10px] tracking-[0.2em] text-white/40 hover:text-punk-neon transition-colors'
          >
            instagram / @punk.blvck
          </a>
          <span className='font-mono text-[10px] tracking-[0.2em] text-white/30 md:text-right'>
            Presence is The New Power
          </span>
        </div>
      </footer>
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/mcp/ingest', {
        email,
        message: 'Membership Application',
        source: 'web_waitlist',
      });
      return res.json();
    },
    onSuccess: () => {
      setEmail('');
    },
    onError: () => {
      toast.error('Application failed. Try again.');
    },
  });

  if (mutation.isSuccess) {
    const reply = mutation.data?.data?.reply || 'Registrado.';
    return (
      <div className='animate-in fade-in duration-500 max-w-sm text-center mx-auto'>
        <Typewriter text={reply} />
      </div>
    );
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (email) mutation.mutate(email);
      }}
      className={`transition-opacity duration-1000 ${mutation.isPending ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
    >
      <label htmlFor='landing-email' className='sr-only'>
        Email para aplicação de acesso
      </label>
      <input
        id='landing-email'
        type='email'
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder='Só o essencial para você entrar no nível certo.'
        required
        aria-label='Email para aplicação de acesso'
        className='bg-transparent border-b border-white/20 focus:border-white/60 focus:outline-none py-3 md:py-2 w-full max-w-[320px] font-sans text-sm tracking-[0.15em] text-white/70 focus:text-white transition-all duration-500 placeholder:text-white/20 text-center uppercase'
      />
      <p className='mt-3 text-[10px] md:text-xs tracking-[0.2em] text-white/40 text-center uppercase'>
        Nem mais. Nem menos.
      </p>
    </form>
  );
}

function Typewriter({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, 40);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return (
    <span className='font-mono text-xs md:text-sm tracking-wider text-punk-neon/80 italic leading-relaxed'>
      &gt; {displayText}
      <span className='animate-pulse ml-1 inline-block w-2 h-4 bg-punk-neon/40 align-middle' />
    </span>
  );
}
