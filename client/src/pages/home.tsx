import { useState, useEffect, useRef } from 'react';
import { CustomCursor } from '@/components/ui/custom-cursor';
import { GlitchText } from '@/components/ui/glitch-text';

export default function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const sections = ['hero', 'programs', 'footer'];

  // Ensure video autoplay works on mobile devices
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true; // Prevent state updates after unmount
    let clickHandler: (() => void) | null = null;
    let touchHandler: (() => void) | null = null;

    const attemptPlay = async () => {
      if (!isMounted || !video) return;

      try {
        // Some browsers require user interaction before autoplay
        if (video.paused && !video.ended) {
          await video.play();
        }
      } catch (error) {
        if (!isMounted) return;

        console.log('Autoplay prevented by browser, video will play on user interaction');
        // Add click listener to start video on first user interaction
        const startVideo = () => {
          if (!isMounted || !video) return;
          video.play().catch(console.error);
          cleanupListeners();
        };

        clickHandler = startVideo;
        touchHandler = startVideo;

        document.addEventListener('click', clickHandler, { once: true });
        document.addEventListener('touchstart', touchHandler, { once: true });
      }
    };

    const cleanupListeners = () => {
      if (clickHandler) {
        document.removeEventListener('click', clickHandler);
        clickHandler = null;
      }
      if (touchHandler) {
        document.removeEventListener('touchstart', touchHandler);
        touchHandler = null;
      }
    };

    // Try to play immediately
    attemptPlay();

    // Also try after a short delay (helps on some mobile devices)
    const timer = setTimeout(() => {
      if (isMounted) attemptPlay();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupListeners();
    };
  }, []);

  // Intersection Observer for scroll-based navigation dots
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px', // Trigger when section is in middle of viewport
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = sections.indexOf(entry.target.id);
          if (index !== -1) {
            setActiveSection(index);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className='min-h-screen bg-punk-base text-white overflow-x-hidden font-sans selection:bg-punk-neon selection:text-black'>
      <CustomCursor />
      <main>
        {/* Navigation Dots - Fixed */}
        <nav
          className='fixed right-3 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 md:gap-3'
          aria-label='Navegação por seções'
        >
          {sections.map((_, i) => (
            <button
              key={i}
              data-testid={`nav-dot-${i}`}
              onClick={() => {
                setActiveSection(i);
                document.getElementById(sections[i])?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`w-1.5 h-1.5 md:w-1.5 md:h-1.5 rounded-full transition-all duration-300 touch-manipulation p-2 -m-2 focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black ${
                activeSection === i
                  ? 'bg-punk-neon scale-110 md:scale-150'
                  : 'bg-white/20 hover:bg-white/50 active:bg-white/60'
              }`}
              aria-label={`Ir para seção ${i + 1}`}
              aria-current={activeSection === i ? 'true' : 'false'}
            />
          ))}
        </nav>

        {/* Logo Header */}
        <div className='fixed top-6 right-4 md:right-8 z-50'>
          <img
            src='/favicon.svg'
            alt='PUNK | BLVCK Logo'
            className='w-12 h-12 md:w-16 md:h-16 object-contain'
          />
        </div>

        {/* Menu Toggle */}
        <button
          data-testid='menu-toggle'
          onClick={() => setNavOpen(!navOpen)}
          aria-label={navOpen ? 'Fechar menu' : 'Abrir menu'}
          className='fixed top-6 left-4 md:left-8 z-50 flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black rounded-sm'
        >
          <div className='flex flex-col gap-1'>
            <span
              className={`block w-5 h-px bg-white transition-all duration-300 ${navOpen ? 'rotate-45 translate-y-1' : ''}`}
              aria-hidden='true'
            />
            <span
              className={`block w-5 h-px bg-white transition-all duration-300 ${navOpen ? '-rotate-45 -translate-y-0.5' : ''}`}
              aria-hidden='true'
            />
          </div>
          <span className='font-mono text-[10px] md:text-[10px] tracking-[0.2em] text-white/70 group-hover:text-white transition-colors'>
            {navOpen ? '[ CLOSE ]' : '[ MENU ]'}
          </span>
        </button>

        {/* Slide Menu */}
        <div
          role='dialog'
          aria-modal='true'
          aria-label='Menu de navegação'
          className={`fixed inset-0 bg-black z-40 transition-transform duration-500 ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className='h-full flex flex-col justify-center px-8 md:px-16'>
            <div className='space-y-8'>
              <a
                href='/dashboard'
                data-testid='nav-link-dashboard'
                onClick={() => setNavOpen(false)}
                className='block font-mono text-xs tracking-[0.3em] text-white/50 hover:text-[hsl(25,100%,50%)] focus:text-[hsl(25,100%,50%)] transition-colors focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1'
              >
                ⧖ dashboard
              </a>
              <a
                href='#programs'
                data-testid='nav-link-training'
                onClick={() => setNavOpen(false)}
                className='block font-mono text-xs tracking-[0.3em] text-white/50 hover:text-[hsl(25,100%,50%)] focus:text-[hsl(25,100%,50%)] transition-colors focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1'
              >
                // training
              </a>
              <a
                href='#programs'
                data-testid='nav-link-zone'
                onClick={() => setNavOpen(false)}
                className='block font-mono text-xs tracking-[0.3em] text-white/50 hover:text-[hsl(25,100%,50%)] focus:text-[hsl(25,100%,50%)] transition-colors focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1'
              >
                [zone]
              </a>
              <a
                href='#programs'
                data-testid='nav-link-yoga'
                onClick={() => setNavOpen(false)}
                className='block font-mono text-xs tracking-[0.3em] text-white/50 hover:text-[hsl(25,100%,50%)] focus:text-[hsl(25,100%,50%)] transition-colors focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1'
              >
                .yoga
              </a>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section
          id='hero'
          aria-label='Seção principal'
          className='relative h-screen flex items-center justify-center overflow-hidden'
        >
          {/* Video Background */}
          <div className='absolute inset-0 z-0'>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              controls={false}
              preload='auto'
              aria-label='Vídeo de fundo abstrato mostrando movimento corporal'
              className='w-full h-full object-cover opacity-30 grayscale'
              onError={e => {
                console.warn('Video failed to load, using fallback');
                e.currentTarget.style.display = 'none';
              }}
              onLoadedData={() => {
                // Ensure video plays after loading
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(console.log);
                }
              }}
            >
              <source
                src='https://res.cloudinary.com/de5jsf8pj/video/upload/v1767916979/pb_vjpgzc.mp4'
                type='video/mp4'
              />
              {/* Fallback for browsers that don't support video */}
              <div className='absolute inset-0 bg-linear-to-br from-gray-900 to-black flex items-center justify-center'>
                <div className='text-white/20 font-mono text-sm'>VIDEO BACKGROUND</div>
              </div>
            </video>
            {/* Spotlight overlay - Fixed gradient strategy to avoid 'onça' effect */}
            <div className='absolute inset-0 bg-linear-to-b from-black via-transparent to-black opacity-80' />
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)]' />
          </div>

          {/* Center Content */}
          <div className='relative z-10 flex flex-col items-center px-4 text-center'>
            <div className='flex items-center gap-4 mb-12'>
              <span className='w-8 h-px bg-white/40' />
              <span className='font-mono text-[10px] tracking-[0.2em] text-white/70'>
                Training. Strength. Conditioning.
              </span>
              <span className='w-8 h-px bg-white/40' />
            </div>

            <h1 className='text-4xl md:text-7xl font-industrial tracking-tighter text-white font-bold uppercase mb-2 md:mb-4 leading-[0.9] md:leading-none'>
              IT'S NOT JUST <br className='md:hidden' /> FITNESS.
            </h1>
            <h2 className='text-lg md:text-2xl font-industrial tracking-[0.2em] md:tracking-[0.3em] text-punk-neon font-light uppercase mb-12 md:mb-16'>
              <GlitchText text="IT'S LIFE." />
            </h2>

            <p className='max-w-xl text-sm md:text-base text-white/80 leading-relaxed mb-6'>
              <span className='block'>Mais que um espaço de treino.</span>
              <span className='block'>Um ecossistema de performance premium e convivência.</span>
            </p>
            <p className='max-w-2xl text-xs md:text-sm text-white/60 leading-relaxed'>
              <span className='block'>Experiência além da repetição.</span>
              <span className='block'>
                Cada detalhe do design, da energia e dos programas foi pensado para transformar
                presença em resultado palpável.
              </span>
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2'>
            <span className='font-mono text-[9px] tracking-[0.3em] text-white/30'>SCROLL</span>
            <div className='w-px h-8 bg-linear-to-b from-white/30 to-transparent pulse-subtle' />
          </div>

          {/* Corner Markers */}
          <div className='absolute top-6 right-4 md:right-8 font-mono text-[9px] tracking-[0.2em] text-white/20'>
            ///
          </div>
        </section>

        {/* Programs Section */}
        <section
          id='programs'
          aria-label='Programas e sistemas oferecidos'
          className='min-h-screen py-24 md:py-32 px-4 md:px-8 lg:px-16'
        >
          <div className='max-w-6xl mx-auto'>
            {/* Section Header */}
            <div className='flex items-center gap-4 mb-12 md:mb-24'>
              <span className='w-8 md:w-12 h-px bg-punk-neon' />
              <span className='font-mono text-[10px] md:text-xs tracking-[0.3em] text-white/70 italic'>
                SYSTEMS
              </span>
            </div>

            {/* Programs Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10'>
              {/* Training */}
              <div
                data-testid='program-training'
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Adicionar ação se necessário
                  }
                }}
                className='bg-black p-8 md:p-12 group cursor-pointer transition-colors hover:bg-white/2 focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black'
                aria-label='Programa de treinamento - Performance Optimization Protocol'
              >
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>01</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-punk-neon transition-colors' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-4 uppercase'>
                  // training
                </h3>
                <p className='font-sans text-xs tracking-wider text-white/60 leading-relaxed uppercase'>
                  PERFORMANCE
                  <br />
                  OPTIMIZATION
                  <br />
                  PROTOCOL
                </p>
              </div>

              {/* Zone */}
              <div
                data-testid='program-zone'
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Adicionar ação se necessário
                  }
                }}
                className='bg-black p-8 md:p-12 group cursor-pointer transition-colors hover:bg-white/2 focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black'
                aria-label='Programa Zone - High Intensity Framework'
              >
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>02</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-punk-neon transition-colors' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-4 uppercase'>
                  [zone]
                </h3>
                <p className='font-sans text-xs tracking-wider text-white/60 leading-relaxed uppercase'>
                  HIGH
                  <br />
                  INTENSITY
                  <br />
                  FRAMEWORK
                </p>
              </div>

              {/* Yoga */}
              <div
                data-testid='program-yoga'
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Adicionar ação se necessário
                  }
                }}
                className='bg-black p-8 md:p-12 group cursor-pointer transition-colors hover:bg-white/2 focus:outline-none focus:ring-2 focus:ring-punk-neon focus:ring-offset-2 focus:ring-offset-black'
                aria-label='Programa Yoga - Mobility Restoration Sequence'
              >
                <div className='flex items-start justify-between mb-8'>
                  <span className='font-mono text-xs text-white/50'>03</span>
                  <span className='w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-punk-neon transition-colors' />
                </div>
                <h3 className='font-industrial text-xl tracking-widest text-white mb-4 uppercase'>
                  .yoga
                </h3>
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
      </main>

      {/* Footer */}
      <footer
        id='footer'
        aria-label='Rodapé'
        className='py-16 md:py-24 px-4 md:px-8 lg:px-16 border-t border-white/10'
      >
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24'>
            {/* Brand */}
            <div>
              <span
                className='font-mono text-xs tracking-[0.2em] text-white/70 block'
                data-testid='footer-brand'
              >
                PUNK | BLVCK ©
              </span>
            </div>

            {/* Instagram */}
            <div>
              <a
                href='https://www.instagram.com/punk.blvck'
                target='_blank'
                rel='noreferrer noopener'
                className='font-mono text-[10px] tracking-[0.2em] text-white/40 hover:text-punk-neon transition-colors'
              >
                instagram / @punk.blvck
              </a>
            </div>

            {/* Location */}
            <div className='md:text-right'>
              <span
                className='font-mono text-[10px] tracking-[0.2em] text-white/30'
                data-testid='footer-location'
              >
                Plaza D'Oro Shopping // Goiânia - GO
              </span>
            </div>
          </div>

          {/* Bottom Line */}
          <div className='mt-16 pt-8 border-t border-white/5 flex items-center justify-between'>
            <span className='font-mono text-[9px] text-white/20'>Presence is The New Power</span>
            <div className='flex items-center gap-2'>
              <span className='w-1 h-1 rounded-full bg-[hsl(25,100%,50%)]' />
              <span className='font-mono text-[9px] text-white/20'>ACTIVE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
