"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refresh ScrollTrigger on resize or mount
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  useGSAP(() => {
    // Media query check for reduced motion
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline();
      
      // Initial state setup for hero elements
      gsap.set(".hero-element", { y: 30, opacity: 0 });
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

      // Continuous slow pulse for the background glow
      gsap.to(".glow-orb", {
        scale: 1.1,
        opacity: 0.8,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Parallax orb on scroll
      gsap.to(".glow-orb", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

      // Bouncing Chevron Cue
      gsap.to(".scroll-cue", {
        y: 10,
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: "sine.inOut"
      });

      // Section 2: The Problem (Horizontal Scatter)
      gsap.from(".problem-card", {
        opacity: 0,
        y: 50,
        rotation: (i) => i % 2 === 0 ? -10 : 10,
        stagger: 0.1,
        scrollTrigger: {
          trigger: "#section-problem",
          start: "top 80%",
          end: "top 30%",
          scrub: 1,
        }
      });

      // Section 3: The Ingest Moment (Pinned Scrub)
      const ingestTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#section-ingest",
          start: "center center",
          end: "+=150%",
          pin: true,
          scrub: 1,
        }
      });
      
      // Step 1: Fetching
      ingestTl.to(".ingest-progress", { width: "25%", ease: "none" })
        .to(".ingest-step-1 .step-circle", { backgroundColor: "#27a644", color: "white" }, "<")
        .to(".ingest-step-1 .step-label", { color: "#8a8f98" }, "<");
      
      // Step 2: Extracting
      ingestTl.to(".ingest-progress", { width: "50%", ease: "none" })
        .to(".ingest-step-2 .step-circle", { backgroundColor: "#27a644", color: "white" }, "<")
        .to(".ingest-step-2 .step-label", { color: "#8a8f98" }, "<");

      // Step 3: remember()
      ingestTl.to(".ingest-progress", { width: "75%", ease: "none" })
        .to(".ingest-step-3 .step-circle", { backgroundColor: "#27a644", color: "white" }, "<")
        .to(".ingest-step-3 .step-label", { color: "#8a8f98" }, "<");

      // Step 4: improve()
      ingestTl.to(".ingest-progress", { width: "100%", ease: "none" })
        .to(".ingest-step-4 .step-circle", { backgroundColor: "#27a644", color: "white" }, "<")
        .to(".ingest-step-4 .step-label", { color: "#8a8f98" }, "<");

      // Section 4: What Changed Reveal (Pinned Scrub)
      const resolveTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#section-resolve",
          start: "center center",
          end: "+=200%",
          pin: true,
          scrub: 1,
        }
      });

      // Fade in Old
      resolveTl.from(".resolve-old", { opacity: 0, x: -50, filter: "grayscale(100%)", duration: 1 })
      // Slide in New
      .from(".resolve-new", { opacity: 0, x: 50, duration: 1 })
      .from(".resolve-icon", { scale: 0, rotation: -90, duration: 0.5 }, "<0.5")
      // Highlight Button
      .to(".btn-keep-new", { scale: 1.05, boxShadow: "0 0 15px rgba(94,106,210,0.6)", duration: 0.5 })
      .to(".btn-keep-new", { scale: 1, boxShadow: "0 0 0px rgba(94,106,210,0)", duration: 0.2 })
      // Show Diff below
      .from(".resolve-diff", { opacity: 0, y: 30, duration: 1 });

      // Section 5: Confidence Timeline
      const decayTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#section-decay",
          start: "top 60%",
          end: "bottom 40%",
          scrub: 1,
        }
      });

      decayTl.to(".bar-old", { width: "10%", backgroundColor: "#3a3f4a", duration: 2 })
             .to(".bar-new", { width: "95%", backgroundColor: "#5e6ad2", duration: 2 }, "<");
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      // Fallback for reduced motion: just fade things in
      gsap.to(".hero-element", { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 });
      gsap.to(".glow-orb", { opacity: 1, duration: 0.5 });
      gsap.to(".problem-card, .resolve-old, .resolve-new, .resolve-diff", { opacity: 1, duration: 0.5 });
    });

  }, { scope: containerRef });

  const handleLogin = () => {
    setIsLoading(true);
    gsap.to(".primary-btn", { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
    setTimeout(() => {
      router.push("/graph");
    }, 600);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-canvas text-ink selection:bg-primary/30 relative overflow-hidden flex flex-col items-center">
      
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>

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
          <a href="https://github.com/IamNishant51/Synapse----Ai-" target="_blank" rel="noreferrer" className="text-sm font-medium text-ink-subtle hover:text-ink transition-colors">
            GitHub
          </a>
          <button onClick={handleLogin} className="text-sm font-medium px-4 py-2 rounded-md bg-surface-1 border border-hairline hover:bg-surface-2 transition-all cursor-pointer">
            Enter App
          </button>
        </div>
      </header>

      {/* Section 1: Hero */}
      <section className="w-full max-w-6xl mx-auto px-6 pt-12 md:pt-20 pb-24 z-10 min-h-[80vh] flex flex-col items-center justify-center relative">
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
              href="https://github.com/IamNishant51/Synapse----Ai-"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-surface-1 border border-hairline text-ink font-medium text-sm hover:bg-surface-2 transition-all cursor-pointer flex items-center justify-center"
            >
              Read the Spec
            </a>
          </div>
        </div>

        <div className="scroll-cue absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs uppercase tracking-widest text-ink-tertiary">Scroll</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </section>

      {/* Section 2: The Problem */}
      <section id="section-problem" className="w-full max-w-6xl mx-auto px-6 py-32 z-10 flex flex-col items-center justify-center">
        <h2 className="text-3xl md:text-4xl font-semibold mb-16 text-center text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
          Knowledge is scattered.
        </h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 w-full">
          {["ChatGPT", "Claude", "Notion", "GitHub", "PDFs"].map((source, i) => (
            <div key={source} className="problem-card px-6 py-4 bg-surface-1 border border-hairline rounded-xl shadow-lg flex items-center justify-center">
              <span className="text-ink-muted font-medium">{source}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: The Ingest Moment */}
      <section id="section-ingest" className="w-full bg-surface-1/50 border-y border-hairline py-32 z-10 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="max-w-4xl mx-auto px-6 w-full flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl font-semibold mb-4 text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
              Omnivorous Ingestion
            </h2>
            <p className="text-ink-muted leading-relaxed mb-8">
              Feed Synapse your scattered sources. It parses, extracts, and weaves them into a unified graph using Cognee's primitives.
            </p>
            
            {/* Mock Ingestion Stepper */}
            <div className="w-full bg-surface-1 border border-hairline rounded-lg p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-0 w-full relative">
                   <div className="absolute top-1/2 left-0 w-full h-px bg-surface-3 -translate-y-1/2 z-0"></div>
                   <div className="ingest-progress absolute top-1/2 left-0 w-0 h-px bg-semantic-success -translate-y-1/2 z-0"></div>
                   
                   {["Fetching", "Extracting", "remember()", "improve()"].map((label, i) => (
                     <div key={label} className={`ingest-step-${i+1} flex-1 flex flex-col items-center gap-3 z-10`}>
                        <div className="step-circle w-8 h-8 rounded-full bg-surface-2 border border-hairline flex items-center justify-center text-xs text-ink-tertiary transition-colors duration-300">
                          {i+1}
                        </div>
                        <span className="step-label text-xs text-ink-tertiary transition-colors duration-300 bg-surface-1 px-2">{label}</span>
                     </div>
                   ))}
                </div>
              </div>
            </div>

          </div>
          <div className="flex-1 hidden md:flex justify-center">
            <div className="w-64 h-64 rounded-full border border-hairline/30 flex items-center justify-center relative">
               <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_10s_linear_infinite]" style={{ borderTopColor: "transparent" }}></div>
               <div className="w-32 h-32 rounded-full bg-primary/10 blur-xl"></div>
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5e6ad2" strokeWidth="1.5">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/>
                  <path d="M12 8V16M8 12H16"/>
               </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: What Changed */}
      <section id="section-resolve" className="w-full max-w-6xl mx-auto px-6 py-32 z-10 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
            Conflict Resolution
          </h2>
          <p className="text-ink-muted max-w-2xl mx-auto">
            When new facts contradict old ones, Synapse flags the conflict for human review instead of silently overwriting.
          </p>
        </div>

        <div className="w-full max-w-3xl bg-surface-1 border border-hairline rounded-xl overflow-hidden shadow-2xl">
          <div className="h-1 bg-conflict-warning" />
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <svg className="resolve-icon" width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="#e0a328" strokeWidth="1.5" />
                    <path d="M8 4.5V8.5M8 11V11.01" stroke="#e0a328" strokeWidth="1.5" strokeLinecap="round" />
                 </svg>
                 <span className="font-medium text-ink">Conflict detected — "Database choice"</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="resolve-old p-5 rounded-lg bg-surface-2 opacity-50">
                 <span className="text-xs text-ink-tertiary uppercase tracking-wider mb-2 block">Old Belief</span>
                 <p className="text-sm text-ink-muted">"Using Postgres for the main datastore"</p>
              </div>
              <div className="resolve-new p-5 rounded-lg bg-surface-2 border border-primary/20 relative">
                 <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-surface-1 border border-hairline flex items-center justify-center z-10 hidden md:flex">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                 </div>
                 <span className="text-xs text-primary uppercase tracking-wider mb-2 block">New Evidence</span>
                 <p className="text-sm text-ink-muted">"Switched everything to Supabase"</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button className="px-6 py-2 rounded-md border border-hairline text-sm text-ink-subtle">Keep Old</button>
              <button className="btn-keep-new px-6 py-2 rounded-md bg-primary text-white text-sm font-medium">Keep New</button>
              <button className="px-6 py-2 rounded-md border border-hairline text-sm text-ink-subtle">Keep Both</button>
            </div>
            
            <div className="resolve-diff mt-8 pt-8 border-t border-hairline">
               <span className="text-xs text-semantic-success block mb-2">+ New Decision Recorded</span>
               <div className="p-4 bg-surface-2 rounded-lg text-sm text-ink-muted font-mono">
                 <span className="text-semantic-danger">- Postgres</span><br/>
                 <span className="text-semantic-success">+ Supabase</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Confidence Timeline */}
      <section id="section-decay" className="w-full bg-surface-1/30 py-32 z-10 flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto px-6 w-full text-center">
          <h2 className="text-3xl font-semibold mb-4 text-ink" style={{ fontFamily: "Outfit, sans-serif" }}>
            Active Decay
          </h2>
          <p className="text-ink-muted mb-16 max-w-2xl mx-auto">
            Confidence scores naturally decay over time. As weeks pass without reinforcement, old beliefs fade away automatically.
          </p>

          <div className="w-full max-w-2xl mx-auto space-y-8 text-left">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-ink-subtle">Postgres (Last seen: 3 months ago)</span>
                <span className="text-ink-tertiary font-mono">Decaying</span>
              </div>
              <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className="bar-old h-full bg-semantic-danger w-[90%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary font-medium">Supabase (Last seen: Today)</span>
                <span className="text-primary font-mono">Reinforced</span>
              </div>
              <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
                <div className="bar-new h-full bg-primary w-[5%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Closing CTA */}
      <section className="w-full max-w-4xl mx-auto px-6 py-40 z-10 flex flex-col items-center justify-center relative min-h-[60vh]">
        {/* Returning Glow Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-0">
          <div className="glow-orb absolute inset-0 rounded-full bg-primary/20 blur-[100px]" />
        </div>
        
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-ink mb-8 relative z-10 text-center" style={{ fontFamily: "Outfit, sans-serif" }}>
          Ready to build your mind palace?
        </h2>
        <button
          onClick={handleLogin}
          className="relative z-10 px-8 py-4 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-xl shadow-primary/20 cursor-pointer"
        >
          Initialize Graph
        </button>
      </section>

      <footer className="w-full py-8 border-t border-hairline mt-auto relative z-10 bg-canvas">
        <p className="text-center text-xs text-ink-tertiary">
          Designed for the WeMakeDevs × Cognee Hackathon 2026. Built with Next.js, FastAPI, and GSAP.
        </p>
      </footer>
    </div>
  );
}
