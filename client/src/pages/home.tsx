import { useState } from "react";

export default function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const sections = ["hero", "programs", "footer"];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Navigation Dots - Fixed */}
      <nav className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
        {sections.map((_, i) => (
          <button
            key={i}
            data-testid={`nav-dot-${i}`}
            onClick={() => {
              setActiveSection(i);
              document.getElementById(sections[i])?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              activeSection === i ? "bg-[hsl(25,100%,50%)] scale-150" : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to section ${i + 1}`}
          />
        ))}
      </nav>

      {/* Menu Toggle */}
      <button
        data-testid="menu-toggle"
        onClick={() => setNavOpen(!navOpen)}
        className="fixed top-6 left-4 md:left-8 z-50 flex items-center gap-2 group"
      >
        <div className="flex flex-col gap-1">
          <span className={`block w-5 h-px bg-white transition-all duration-300 ${navOpen ? "rotate-45 translate-y-1" : ""}`} />
          <span className={`block w-5 h-px bg-white transition-all duration-300 ${navOpen ? "-rotate-45 -translate-y-0.5" : ""}`} />
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/40 group-hover:text-white/70 transition-colors hidden md:block">
          {navOpen ? "[ CLOSE ]" : "[ MENU ]"}
        </span>
      </button>

      {/* Slide Menu */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-transform duration-500 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col justify-center px-8 md:px-16">
          <div className="space-y-8">
            <a
              href="#programs"
              data-testid="nav-link-training"
              onClick={() => setNavOpen(false)}
              className="block font-mono text-xs tracking-[0.3em] text-white/50 hover:text-[hsl(25,100%,50%)] transition-colors"
            >
              // training
            </a>
            <a
              href="#programs"
              data-testid="nav-link-zone"
              onClick={() => setNavOpen(false)}
              className="block font-mono text-xs tracking-[0.3em] text-white/50 hover:text-[hsl(25,100%,50%)] transition-colors"
            >
              [zone]
            </a>
            <a
              href="#programs"
              data-testid="nav-link-yoga"
              onClick={() => setNavOpen(false)}
              className="block font-mono text-xs tracking-[0.3em] text-white/50 hover:text-[hsl(25,100%,50%)] transition-colors"
            >
              .yoga
            </a>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-30 grayscale"
          >
            <source src="https://res.cloudinary.com/de5jsf8pj/video/upload/v1767916979/pb_vjpgzc.mov" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center px-4">
          <img
            src="https://res.cloudinary.com/de5jsf8pj/image/upload/v1767914884/blvck_logo_whofxk.png"
            alt="BLVCK"
            data-testid="logo-main"
            className="w-40 md:w-56 lg:w-64 mb-8"
          />
          
          {/* Technical Markers */}
          <div className="flex items-center gap-4 mt-8">
            <span className="w-8 h-px bg-white/20" />
            <span className="font-mono text-[10px] tracking-[0.4em] text-white/30">SYS.01</span>
            <span className="w-8 h-px bg-white/20" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[9px] tracking-[0.3em] text-white/30">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent pulse-subtle" />
        </div>

        {/* Corner Markers */}
        <div className="absolute top-6 right-4 md:right-8 font-mono text-[9px] tracking-[0.2em] text-white/20">
          ///
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="min-h-screen py-24 md:py-32 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center gap-4 mb-16 md:mb-24">
            <span className="w-12 h-px bg-[hsl(25,100%,50%)]" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-white/40">SYSTEMS</span>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
            {/* Training */}
            <div
              data-testid="program-training"
              className="bg-black p-8 md:p-12 group cursor-pointer transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-[10px] text-white/30">01</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[hsl(25,100%,50%)] transition-colors" />
              </div>
              <h3 className="font-mono text-sm tracking-[0.2em] text-white/70 mb-4">// training</h3>
              <p className="font-mono text-[10px] tracking-wider text-white/30 leading-relaxed">
                PERFORMANCE<br />
                OPTIMIZATION<br />
                PROTOCOL
              </p>
            </div>

            {/* Zone */}
            <div
              data-testid="program-zone"
              className="bg-black p-8 md:p-12 group cursor-pointer transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-[10px] text-white/30">02</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[hsl(25,100%,50%)] transition-colors" />
              </div>
              <h3 className="font-mono text-sm tracking-[0.2em] text-white/70 mb-4">[zone]</h3>
              <p className="font-mono text-[10px] tracking-wider text-white/30 leading-relaxed">
                HIGH<br />
                INTENSITY<br />
                FRAMEWORK
              </p>
            </div>

            {/* Yoga */}
            <div
              data-testid="program-yoga"
              className="bg-black p-8 md:p-12 group cursor-pointer transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-[10px] text-white/30">03</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[hsl(25,100%,50%)] transition-colors" />
              </div>
              <h3 className="font-mono text-sm tracking-[0.2em] text-white/70 mb-4">.yoga</h3>
              <p className="font-mono text-[10px] tracking-wider text-white/30 leading-relaxed">
                MOBILITY<br />
                RESTORATION<br />
                SEQUENCE
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="py-16 md:py-24 px-4 md:px-8 lg:px-16 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            {/* Brand */}
            <div>
              <span className="font-mono text-xs tracking-[0.2em] text-white/70" data-testid="footer-brand">
                PUNK | BLVCK ©
              </span>
            </div>

            {/* Location */}
            <div className="md:text-right">
              <span className="font-mono text-[10px] tracking-[0.2em] text-white/30" data-testid="footer-location">
                Plaza D'Oro Shopping // Goiânia - GO
              </span>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="mt-16 pt-8 border-t border-white/5 flex items-center justify-between">
            <span className="font-mono text-[9px] text-white/20">SYS.VERSION.01</span>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[hsl(25,100%,50%)]" />
              <span className="font-mono text-[9px] text-white/20">ACTIVE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}