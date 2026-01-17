import { useState, useRef, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type ExperienceStep = 'intro' | 'q1' | 'q2' | 'q3' | 'q4' | 'email' | 'success';

interface UserSignal {
  choice: string;
  timestamp: number;
  duration: number;
}

const QUESTIONS = [
  { id: 'q1', left: 'AGILIDADE', right: 'PRECISÃO', key: 'agility_vs_precision' },
  { id: 'q2', left: 'SOZINHO', right: 'EM EQUIPE', key: 'solo_vs_team' },
  { id: 'q3', left: 'DISCIPLINA', right: 'MOTIVAÇÃO', key: 'discipline_vs_motivation' },
  { id: 'q4', left: 'SISTEMA', right: 'INTUIÇÃO', key: 'system_vs_intuition' },
];

export default function Landing() {
  const [step, setStep] = useState<ExperienceStep>('intro');
  const [signals, setSignals] = useState<Record<string, UserSignal>>({});
  const startTime = useRef<number>(Date.now());

  const handleDecision = (questionKey: string, choice: string) => {
    const now = Date.now();
    const duration = now - startTime.current;

    setSignals(prev => ({
      ...prev,
      [questionKey]: { choice, timestamp: now, duration },
    }));

    // Next step logic
    const currentIndex = QUESTIONS.findIndex(q => q.key === questionKey);
    if (currentIndex < QUESTIONS.length - 1) {
      setStep(`q${currentIndex + 2}` as ExperienceStep);
      startTime.current = Date.now();
    } else {
      setStep('email');
    }
  };

  const startExperience = () => {
    setStep('q1');
    startTime.current = Date.now();
  };

  return (
    <div className='min-h-screen bg-punk-base text-white overflow-x-hidden font-sans selection:bg-punk-neon selection:text-black'>
      <main>
        {/* THE SIGNAL - Experience Area */}
        <section className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
          <div className='absolute inset-0 bg-linear-to-b from-black via-transparent to-black opacity-80' />
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)]' />

          {/* Grain Effect Overlay */}
          <div
            className='absolute inset-0 opacity-[0.03] pointer-events-none'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className='relative z-10 w-full max-w-4xl'>
            <AnimatePresence mode='wait'>
              {step === 'intro' && (
                <motion.div
                  key='intro'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8 }}
                  className='text-center space-y-12'
                >
                  <div className='flex items-center justify-center gap-4'>
                    <span className='w-8 h-px bg-white/40' />
                    <span className='font-mono text-[10px] tracking-[0.2em] text-white/70 uppercase'>
                      The Signal / Protocol
                    </span>
                    <span className='w-8 h-px bg-white/40' />
                  </div>

                  <h1 className='text-4xl md:text-7xl font-industrial tracking-tight text-white font-bold uppercase leading-tight'>
                    ONDE PERFORMANCE,
                    <br />
                    ENCONTRA EXCLUSIVIDADE.
                  </h1>

                  <button
                    onClick={startExperience}
                    className='group relative px-12 py-4 border border-white/20 hover:border-punk-neon transition-all duration-500 overflow-hidden'
                  >
                    <span className='relative z-10 font-mono text-sm tracking-[0.3em] group-hover:text-black transition-colors duration-300'>
                      [ SOLICITE ACESSO ]
                    </span>
                    <span className='absolute inset-0 bg-punk-neon scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-in-out' />
                  </button>
                </motion.div>
              )}

              {QUESTIONS.map(
                q =>
                  step === q.id && (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0'
                    >
                      <DecisionButton
                        label={q.left}
                        onClick={() => handleDecision(q.key, q.left)}
                      />
                      <DecisionButton
                        label={q.right}
                        onClick={() => handleDecision(q.key, q.right)}
                      />
                    </motion.div>
                  )
              )}

              {step === 'email' && (
                <motion.div
                  key='email'
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='text-center max-w-md mx-auto space-y-8'
                >
                  <div className='font-mono text-[10px] tracking-[0.4em] text-punk-neon uppercase mb-4'>
                    ANÁLISE DE PERFIL COMPLETADA
                  </div>
                  <h2 className='text-2xl md:text-4xl font-industrial text-white uppercase tracking-wider'>
                    COLOQUE SEU E-MAIL.
                    <br />
                    NÓS LEREMOS SUA INTENÇÃO.
                  </h2>
                  <SignalForm signals={signals} onSuccess={() => setStep('success')} />
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key='success'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='text-center space-y-6'
                >
                  <div className='w-16 h-16 border border-punk-neon flex items-center justify-center mx-auto mb-8'>
                    <div className='w-8 h-8 bg-punk-neon animate-pulse' />
                  </div>
                  <h2 className='text-3xl font-industrial text-white uppercase tracking-widest'>
                    SINAL RECEBIDO.
                  </h2>
                  <p className='font-mono text-xs text-white/70 tracking-widest'>
                    Aguarde contato se sua frequência for compatível.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Programs */}
        <section className='py-20 md:py-28 px-4 md:px-8 lg:px-16'>
          <div className='max-w-6xl mx-auto'>
            <div className='flex items-center gap-4 mb-10 md:mb-16'>
              <span className='w-8 md:w-12 h-px bg-punk-neon' />
              <span className='font-mono text-[10px] md:text-xs tracking-[0.3em] text-white/80 italic'>
                SCHEDULE
              </span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10'>
              <ScheduleCard
                num='01'
                title='BLVCK .training'
                subtitle='Horários de funcionamento'
                items={[
                  { label: 'Segunda a sexta', value: '05:00 às 22:00' },
                  { label: 'Sábado e Feriados', value: '07:00 às 14:00' },
                ]}
              />
              <ScheduleCard
                num='02'
                title='BLVCK [zone]'
                subtitle='Horários de funcionamento'
                items={[
                  {
                    label: 'Segunda a sexta',
                    value: ['06:00 (manhã)', '07:00 (manhã)', '17:30 (tarde)', '18:30 (noite)'],
                  },
                ]}
              />
              <ScheduleCard
                num='03'
                title='BLVCK .yoga'
                subtitle='Horários de funcionamento'
                items={[
                  { label: 'Segunda e quarta', value: '16:00 (tarde)' },
                  { label: 'Terça e quinta', value: '09:30 (manhã)' },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Context */}
        <section className='py-16 md:py-20 px-4 md:px-8 lg:px-16'>
          <div className='max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6'>
            <span className='font-mono text-[10px] tracking-[0.2em] text-white/70 uppercase'>
              Plaza D&apos;Oro Shopping // Goiânia - GO
            </span>
            <span className='font-mono text-[10px] tracking-[0.2em] text-white/60 uppercase'>
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
            className='font-mono text-[10px] tracking-[0.2em] text-white/60 hover:text-punk-neon transition-colors'
          >
            instagram / @punk.blvck
          </a>
          <span className='font-mono text-[10px] tracking-[0.2em] text-white/60 md:text-right'>
            Presence is The New Power
          </span>
        </div>
      </footer>
    </div>
  );
}

function DecisionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative h-[300px] md:h-[600px] flex items-center justify-center overflow-hidden border border-white/5 hover:border-punk-neon transition-colors duration-700`}
    >
      <span className='relative z-10 font-industrial text-4xl md:text-7xl tracking-tighter text-white/60 group-hover:text-white group-hover:scale-110 transition-all duration-700 uppercase'>
        {label}
      </span>
      <div className='absolute inset-0 bg-punk-neon/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out' />
      <div className='absolute bottom-8 font-mono text-[8px] tracking-[0.4em] text-white/0 group-hover:text-punk-neon/60 transition-all duration-500'>
        SELECT // {label}
      </div>
    </button>
  );
}

function ScheduleCard({ num, title, subtitle, items }: any) {
  return (
    <div className='bg-black p-8 md:p-12 flex flex-col group hover:bg-zinc-950 transition-colors duration-500'>
      <div className='flex items-start justify-between mb-8'>
        <span className='font-mono text-xs text-white/70'>{num}</span>
        <span className='w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-punk-neon transition-colors' />
      </div>
      <h2 className='font-industrial text-xl tracking-widest text-white mb-2 uppercase'>{title}</h2>
      <p className='font-mono text-[10px] tracking-wider text-punk-neon mb-6 uppercase'>
        {subtitle}
      </p>
      <div className='space-y-4 font-sans text-xs tracking-wide text-white/80 flex-grow'>
        {items.map((item: any, i: number) => (
          <div key={i}>
            <p className='text-white/50 mb-1 uppercase text-[10px]'>{item.label}</p>
            {Array.isArray(item.value) ? (
              <ul className='space-y-1'>
                {item.value.map((v: string, j: number) => (
                  <li key={j}>{v}</li>
                ))}
              </ul>
            ) : (
              <p>{item.value}</p>
            )}
          </div>
        ))}
      </div>
      <div className='mt-auto pt-6 text-right'>
        <span className='font-mono text-[9px] text-white/30'>schedule ///</span>
      </div>
    </div>
  );
}

function SignalForm({
  signals,
  onSuccess,
}: {
  signals: Record<string, UserSignal>;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');

  const metadata = useMemo(() => {
    const durations = Object.values(signals).map(s => s.duration);
    const avgSpeed = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

    // Logic for profiling
    const profiles = [];
    if (signals.discipline_vs_motivation?.choice === 'DISCIPLINA') profiles.push('discipline');
    if (signals.system_vs_intuition?.choice === 'SISTEMA') profiles.push('system');
    if (avgSpeed < 1500) profiles.push('high_performant');

    return {
      signal_profile: profiles.length > 0 ? `${profiles.join('_')}_high` : 'standard_intent',
      decision_speed: avgSpeed < 1200 ? 'fast' : avgSpeed < 2500 ? 'moderate' : 'deliberate',
      pattern:
        signals.agility_vs_precision?.choice === 'AGILIDADE' ? 'leader_b2b' : 'strategic_solo',
      raw_signals: signals,
    };
  }, [signals]);

  const mutation = useMutation({
    mutationFn: async (data: { email: string; message: string }) => {
      const res = await apiRequest('POST', '/api/mcp/ingest', {
        email: data.email,
        message: data.message, // Metadados como string no campo message
        source: 'the_signal_experience',
      });
      return res.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: () => {
      toast.error('O sistema falhou ao ler sua intenção. Tente novamente.');
    },
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (email.trim() && !mutation.isPending) {
          mutation.mutate({
            email: email.trim(),
            message: JSON.stringify(metadata),
          });
        }
      }}
      className={`transition-opacity duration-1000 ${mutation.isPending ? 'opacity-20 pointer-events-none' : 'opacity-100'} w-full`}
    >
      <div className='space-y-6'>
        <input
          type='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder='EMAIL ADDRESS'
          required
          className='bg-transparent border-b border-white/30 focus:border-punk-neon focus:outline-none py-4 w-full font-mono text-sm tracking-[0.2em] text-white text-center uppercase transition-all duration-700'
        />

        <button
          type='submit'
          disabled={mutation.isPending || !email.trim()}
          className='group relative w-full py-4 border border-white/20 hover:border-punk-neon font-mono text-xs tracking-[0.3em] uppercase transition-all duration-500 overflow-hidden'
        >
          <span className='relative z-10 group-hover:text-black transition-colors duration-300'>
            {mutation.isPending ? 'ANALISANDO...' : '[ ENVIAR SINAL ]'}
          </span>
          <span className='absolute inset-0 bg-punk-neon scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-in-out' />
        </button>
      </div>
    </form>
  );
}
