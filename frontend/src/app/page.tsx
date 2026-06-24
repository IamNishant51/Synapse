"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Initial state setup for hero elements
    gsap.set(".hero-element", { y: 30, opacity: 0 });
    gsap.set(".bento-card", { y: 40, opacity: 0 });
    gsap.set(".glow-orb", { scale: 0.8, opacity: 0 });

    // Glow Orb fade in
    tl.to(".glow-orb", {
      scale: 1,
      opacity: 1,
      duration: 1.5,
      ease: "power2.out",
    });

    // Hero content stagger
    tl.to(".hero-element", {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: "back.out(1.2)",
    }, "-=1.0");

    // Bento cards stagger
    tl.to(".bento-card", {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out",
    }, "-=0.4");
    
    // Continuous slow pulse for the background glow
    gsap.to(".glow-orb", {
      scale: 1.1,
      opacity: 0.8,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, { scope: containerRef });

  const handleLogin = () => {
    setIsLoading(true);
    // Button click animation
    gsap.to(".primary-btn", { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
    setTimeout(() => {
      router.push("/graph");
    }, 600);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-canvas text-ink selection:bg-primary/30 relative overflow-hidden flex flex-col items-center">
      
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none z-0">
        <div className="glow-orb absolute inset-0 rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Navigation / Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex items-center justify-between z-10 hero-element">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary shadow-[0_0_15px_rgba(94,106,210,0.5)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
            Synapse
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://github.com/we-make-devs/synapse" target="_blank" rel="noreferrer" className="text-sm font-medium text-ink-subtle hover:text-ink transition-colors">
            GitHub
          </a>
          <button onClick={handleLogin} className="text-sm font-medium px-4 py-2 rounded-md bg-surface-1 border border-hairline hover:bg-surface-2 transition-all cursor-pointer">
            Enter App
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 pt-12 md:pt-20 pb-24 z-10 flex-1 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <div className="hero-element inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-pill bg-surface-1 border border-hairline backdrop-blur-md">
             <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             <span className="text-xs font-medium text-ink-muted">WeMakeDevs × Cognee Hackathon 2026</span>
          </div>
          <h1 className="hero-element text-5xl md:text-7xl font-bold tracking-tight text-ink leading-[1.1] mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
            A memory that knows when to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#8A95FF]">update itself.</span>
          </h1>
          <p className="hero-element text-lg md:text-xl text-ink-muted leading-relaxed mb-10 max-w-2xl mx-auto">
            A self-organizing personal knowledge graph that doesn't just remember — it reconciles, decays, and forgets on purpose.
          </p>
          <div className="hero-element flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="primary-btn relative group overflow-hidden w-full sm:w-auto px-8 py-4 rounded-lg bg-primary text-on-primary font-medium text-sm transition-all duration-300 shadow-[0_0_20px_rgba(94,106,210,0.3)] hover:shadow-[0_0_30px_rgba(94,106,210,0.5)] cursor-pointer border border-primary/50"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </>
                ) : (
                  <>
                    Initialize Graph
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
                      <path d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </>
                )}
              </span>
            </button>
            <a 
              href="https://github.com/we-make-devs/synapse"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-surface-1 border border-hairline text-ink font-medium text-sm hover:bg-surface-2 transition-all cursor-pointer flex items-center justify-center"
            >
              Read the Spec
            </a>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bento-card md:col-span-2 relative overflow-hidden rounded-2xl bg-surface-1 border border-hairline p-8 md:p-10 group hover:border-primary/30 transition-colors duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors duration-500" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2.5V17.5M2.5 10H17.5" stroke="#8a8f98" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-ink mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Omnivorous Ingestion</h3>
              <p className="text-ink-muted leading-relaxed max-w-md">
                Feed Synapse GitHub repos, PDFs, Youtube transcripts, or raw ChatGPT conversations. It parses, extracts, and weaves them into a unified graph.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bento-card relative overflow-hidden rounded-2xl bg-surface-1 border border-hairline p-8 group hover:border-primary/30 transition-colors duration-300">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 5L10 15M5 10H15" stroke="#e0a328" strokeWidth="1.5" strokeLinecap="round" className="rotate-45 origin-center" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-ink mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Conflict Resolution</h3>
              <p className="text-ink-muted leading-relaxed text-sm">
                When new facts contradict old ones, Synapse doesn't just overwrite. It flags the conflict in your inbox for human review.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bento-card relative overflow-hidden rounded-2xl bg-surface-1 border border-hairline p-8 group hover:border-primary/30 transition-colors duration-300">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center mb-6">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 3v2m0 10v2M3 10h2m10 0h2m-2.828-4.95l1.414-1.414M4.93 16.485l1.414-1.414m8.485 0l1.414 1.414M4.93 3.515L6.344 4.93" stroke="#8a8f98" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-ink mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Active Decay</h3>
              <p className="text-ink-muted leading-relaxed text-sm">
                Confidence scores decay over time. Stale nodes fade away, ensuring your graph reflects what you believe today, not three years ago.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bento-card md:col-span-2 relative overflow-hidden rounded-2xl bg-surface-1 border border-hairline p-8 md:p-10 group hover:border-primary/30 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-2/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <div className="w-10 h-10 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center mb-6">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="7" stroke="#8a8f98" strokeWidth="1.5" />
                    <circle cx="10" cy="10" r="2" fill="#5e6ad2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-ink mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>3D Visualizer</h3>
                <p className="text-ink-muted leading-relaxed max-w-sm">
                  Explore your mind's architecture in a fully interactive, force-directed 3D space with confidence-mapped materials.
                </p>
              </div>
              <div className="w-full md:w-64 h-32 rounded-xl bg-surface-2 border border-hairline relative overflow-hidden flex items-center justify-center">
                 {/* Mock 3D visualization element */}
                 <div className="absolute w-20 h-20 rounded-full bg-primary/20 blur-xl animate-pulse" />
                 <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_#5e6ad2] z-10" />
                 <div className="absolute w-full h-full border border-hairline/50 rounded-full scale-150" />
                 <div className="absolute w-full h-full border border-hairline/50 rounded-full scale-[2]" />
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="w-full py-8 border-t border-hairline mt-auto">
        <p className="text-center text-xs text-ink-tertiary">
          Designed for the Cognee Hackathon &copy; 2026. Built with Next.js, FastAPI, and GSAP.
        </p>
      </footer>
    </div>
  );
}
