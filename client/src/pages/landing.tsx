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

            <h1 className='text-3xl md:text-6xl font-industrial tracking-tighter text-white font-bold uppercase mb-10 leading-tight'>
              O treino não é objetivo.
              <br />
              É presença.
              <br />É transformação.
            </h1>

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
              <span className='font-mono text-[10px] md:text-xs tracking-[0.3em] text-white/70 italic'>
                SCHEDULE
              </span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10'>
              <div className='bg-black p-8 md:p-12 flex flex-col'>
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>01</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-2 uppercase'>
                  BLVCK .training
                </h3>
                <p className='font-mono text-[10px] tracking-wider text-punk-neon mb-6 uppercase'>
                  Horários de funcionamento
                </p>
                <div className='space-y-4 font-sans text-xs tracking-wide text-white/80 flex-grow'>
                  <div>
                    <p className='text-white/50 mb-1 uppercase text-[10px]'>Segunda a sexta</p>
                    <p>05:00 às 22:00</p>
                  </div>
                  <div>
                    <p className='text-white/50 mb-1 uppercase text-[10px]'>Sábado e Feriados</p>
                    <p>07:00 às 14:00</p>
                  </div>
                </div>
                <div className='mt-auto pt-6 text-right'>
                  <span className='font-mono text-[9px] text-white/30'>schedule ///</span>
                </div>
              </div>

              <div className='bg-black p-8 md:p-12 flex flex-col'>
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>02</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-2 uppercase'>
                  BLVCK [zone]
                </h3>
                <p className='font-mono text-[10px] tracking-wider text-punk-neon mb-6 uppercase'>
                  Horários de funcionamento
                </p>
                <div className='space-y-4 font-sans text-xs tracking-wide text-white/80 flex-grow'>
                  <div>
                    <p className='text-white/50 mb-1 uppercase text-[10px]'>Segunda a sexta</p>
                    <ul className='space-y-1'>
                      <li>06:00 (manhã)</li>
                      <li>07:00 (manhã)</li>
                      <li>17:30 (tarde)</li>
                      <li>18:30 (noite)</li>
                    </ul>
                  </div>
                </div>
                <div className='mt-auto pt-6 text-right'>
                  <span className='font-mono text-[9px] text-white/30'>schedule ///</span>
                </div>
              </div>

              <div className='bg-black p-8 md:p-12 flex flex-col'>
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>03</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-2 uppercase'>
                  BLVCK .yoga
                </h3>
                <p className='font-mono text-[10px] tracking-wider text-punk-neon mb-6 uppercase'>
                  Horários de funcionamento
                </p>
                <div className='space-y-4 font-sans text-xs tracking-wide text-white/80 flex-grow'>
                  <div>
                    <p className='text-white/50 mb-1 uppercase text-[10px]'>Segunda e quarta</p>
                    <p>16:00 (tarde)</p>
                  </div>
                  <div>
                    <p className='text-white/50 mb-1 uppercase text-[10px]'>Terça e quinta</p>
                    <p>09:30 (manhã)</p>
                  </div>
                </div>
                <div className='mt-auto pt-6 text-right'>
                  <span className='font-mono text-[9px] text-white/30'>schedule ///</span>
                </div>
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

        {/* Philosophy */}
        <section className='py-20 md:py-28 px-4 md:px-8 lg:px-16'>
          <div className='max-w-4xl mx-auto text-center'>
            <p className='text-base md:text-lg text-white/80 leading-relaxed mb-6'>
              Mais que um espaço de treino.
              <br />
              Um ecossistema de performance premium e convivência.
            </p>

            <p className='text-sm md:text-base text-white/60 leading-relaxed'>
              Experiência além da repetição.
              <br />
              Cada detalhe do design, da energia e dos programas foi pensado para transformar
              presença em resultado palpável.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='py-12 md:py-16 px-4 md:px-8 lg:px-16 border-t border-white/10'>
        <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8'>
          <span className='font-mono text-xs tracking-[0.2em] text-white/70 block'>
            PUNK | BLVCK ©
          </span>
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
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: { email: string; message?: string }) => {
      const res = await apiRequest('POST', '/api/mcp/ingest', {
        email: data.email,
        message: data.message?.trim() || undefined, // Envia apenas se preenchido
        source: 'web_waitlist',
      });
      return res.json();
    },
    onSuccess: () => {
      setEmail('');
      setMessage('');
    },
    onError: () => {
      toast.error('Falha ao enviar. Tente novamente.');
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
        if (email.trim()) {
          mutation.mutate({ email: email.trim(), message: message.trim() || undefined });
        }
      }}
      className={`transition-opacity duration-1000 ${mutation.isPending ? 'opacity-20 pointer-events-none' : 'opacity-100'} max-w-[320px] mx-auto`}
    >
      <div className='space-y-4'>
        <div>
          <label htmlFor='landing-email' className='sr-only'>
            Email para garantir seu ticket de acesso
          </label>
          <input
            id='landing-email'
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder='Email'
            required
            aria-label='Email para aplicação de acesso'
            className='bg-transparent border-b border-white/30 focus:border-white/80 focus:outline-none py-3 md:py-2 w-full font-sans text-sm md:text-base tracking-[0.15em] text-white/90 focus:text-white transition-all duration-500 placeholder:text-white/50 placeholder:opacity-100 text-center uppercase'
          />
        </div>

        <div>
          <label htmlFor='landing-message' className='sr-only'>
            Mensagem opcional
          </label>
          <textarea
            id='landing-message'
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder='Conte-nos mais sobre você (opcional)'
            aria-label='Mensagem opcional'
            rows={3}
            maxLength={500}
            className='bg-transparent border-b border-white/30 focus:border-white/70 focus:outline-none py-2 w-full font-sans text-sm md:text-base tracking-widest text-white/85 focus:text-white transition-all duration-500 placeholder:text-white/50 placeholder:opacity-100 text-center resize-none'
          />
        </div>

        <button
          type='submit'
          disabled={mutation.isPending || !email.trim()}
          className='group relative w-full py-3 md:py-2 border border-white/40 hover:border-punk-neon/60 focus:border-punk-neon/80 focus:outline-none font-sans text-sm md:text-base tracking-[0.2em] text-white/90 transition-all duration-500 uppercase disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden'
        >
          <span className='relative z-10 transition-colors duration-300 group-hover:text-black group-focus:text-black'>
            {mutation.isPending ? 'Enviando...' : 'Enviar'}
          </span>
          <span className='absolute inset-0 bg-punk-neon scale-x-0 group-hover:scale-x-100 group-focus:scale-x-100 group-active:scale-x-100 origin-left transition-transform duration-500 ease-in-out z-0' />
        </button>
      </div>
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
