"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const SOURCES = [
  { name: "ChatGPT", icon: "💬" },
  { name: "GitHub", icon: "⌨️" },
  { name: "PDFs", icon: "📄" },
  { name: "YouTube", icon: "▶" },
  { name: "Articles", icon: "📰" },
];

const STEPS = ["Fetch", "Extract", "remember()", "improve()"];

export default function LandingPage() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { ScrollTrigger.refresh(); }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      /* ── Hero entrance ── */
      gsap.set(".fade-up", { y: 24, opacity: 0 });
      gsap.set(".orb", { scale: 0.6, opacity: 0 });

      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .to(".orb", { scale: 1, opacity: 1, duration: 1.4 })
        .to(".fade-up", { y: 0, opacity: 1, stagger: 0.12, duration: 0.7 }, "-=0.9");

      // Subtle idle pulse
      gsap.to(".orb", { scale: 1.08, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });

      // Parallax orb
      gsap.to(".orb", {
        yPercent: 40,
        ease: "none",
        scrollTrigger: { trigger: wrapRef.current, start: "top top", end: "bottom top", scrub: true },
      });

      // Scroll cue bounce
      gsap.to(".scroll-hint", { y: 6, repeat: -1, yoyo: true, duration: 1.2, ease: "sine.inOut" });

      /* ── Section 2: scattered sources ── */
      gsap.from(".src-pill", {
        opacity: 0,
        scale: 0.85,
        y: 30,
        rotation: (i: number) => (i % 2 === 0 ? -6 : 6),
        stagger: 0.08,
        scrollTrigger: { trigger: "#sources", start: "top 82%", end: "top 40%", scrub: 1 },
      });

      /* ── Section 3: Ingest stepper (pinned) ── */
      const ingestTl = gsap.timeline({
        scrollTrigger: { trigger: "#ingest", start: "center center", end: "+=160%", pin: true, scrub: 1 },
      });
      STEPS.forEach((_, i) => {
        const n = i + 1;
        ingestTl
          .to(`.prog-fill`, { width: `${n * 25}%`, ease: "none" })
          .to(`.step-${n} .dot`, { backgroundColor: "#27a644", borderColor: "#27a644", color: "#fff" }, "<")
          .to(`.step-${n} .lbl`, { color: "#d0d6e0" }, "<");
      });

      /* ── Section 4: Conflict resolve (pinned) ── */
      const conflictTl = gsap.timeline({
        scrollTrigger: { trigger: "#conflict", start: "center center", end: "+=220%", pin: true, scrub: 1 },
      });
      conflictTl
        .from(".card-old", { opacity: 0, x: -40, duration: 1 })
        .from(".card-new", { opacity: 0, x: 40, duration: 1 }, "-=0.4")
        .from(".warn-badge", { scale: 0, duration: 0.4 }, "-=0.6")
        .to(".act-new", { boxShadow: "0 0 20px rgba(94,106,210,0.5)", scale: 1.06, duration: 0.4 })
        .to(".act-new", { boxShadow: "none", scale: 1, duration: 0.2 })
        .from(".diff-block", { opacity: 0, y: 20, duration: 0.8 });

      /* ── Section 5: Decay bars ── */
      const decayTl = gsap.timeline({
        scrollTrigger: { trigger: "#decay", start: "top 65%", end: "bottom 35%", scrub: 1 },
      });
      decayTl
        .to(".bar-stale", { width: "8%", duration: 2 })
        .to(".bar-fresh", { width: "92%", duration: 2 }, "<");
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(".fade-up, .src-pill, .card-old, .card-new, .diff-block, .orb", { opacity: 1, y: 0 });
    });
  }, { scope: wrapRef });

  const enter = () => {
    setEntering(true);
    setTimeout(() => router.push("/graph"), 500);
  };

  return (
    <div ref={wrapRef} className="bg-canvas text-ink selection:bg-primary/30 relative">
      {/* grain */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* orb */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] pointer-events-none z-0">
        <div className="orb absolute inset-0 rounded-full bg-gradient-radial from-primary/15 to-transparent blur-[100px]" />
      </div>

      {/* ═══════════ NAV ═══════════ */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-canvas/70 border-b border-hairline/50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 fade-up">
            <div className="w-7 h-7 rounded-md bg-primary grid place-items-center shadow-[0_0_12px_rgba(94,106,210,0.45)]">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="#fff" strokeWidth="2"/><circle cx="8" cy="8" r="1.5" fill="#fff"/></svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Synapse</span>
          </div>
          <div className="flex items-center gap-5 fade-up">
            <a href="https://github.com/IamNishant51/Synapse----Ai-" target="_blank" rel="noreferrer"
              className="text-[13px] text-ink-subtle hover:text-ink transition-colors">GitHub</a>
            <button onClick={enter}
              className="text-[13px] font-medium px-3.5 py-1.5 rounded-md bg-surface-1 border border-hairline hover:bg-surface-2 transition-all cursor-pointer">
              Open App →
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════ 1 · HERO ═══════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 md:pt-36 pb-28 min-h-[85vh] flex flex-col items-center justify-center text-center">
        <div className="fade-up inline-flex items-center gap-2 px-3 py-1 mb-7 rounded-full bg-surface-1/80 border border-hairline text-[11px] font-medium text-ink-subtle backdrop-blur">
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
          WeMakeDevs × Cognee Hackathon 2026
        </div>

        <h1 className="fade-up text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-[1.08] tracking-tight mb-5 max-w-3xl"
          style={{ fontFamily: "Outfit, sans-serif" }}>
          Your knowledge graph shouldn&apos;t need{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#8A95FF] to-primary bg-[length:200%] animate-[shimmer_3s_ease-in-out_infinite]">
            a reboot.
          </span>
        </h1>

        <p className="fade-up text-[clamp(0.95rem,1.8vw,1.15rem)] text-ink-muted leading-relaxed max-w-xl mb-10">
          Synapse ingests your scattered notes, detects when facts contradict each other, and lets old beliefs decay — so what you know today is always what matters.
        </p>

        <div className="fade-up flex flex-col sm:flex-row items-center gap-3">
          <button onClick={enter} disabled={entering}
            className="primary-btn group relative overflow-hidden px-7 py-3 rounded-lg bg-primary text-white text-sm font-medium transition-all shadow-[0_2px_24px_rgba(94,106,210,0.25)] hover:shadow-[0_2px_32px_rgba(94,106,210,0.4)] cursor-pointer border border-white/10 disabled:opacity-60">
            <span className="relative z-10 flex items-center gap-2">
              {entering ? "Opening…" : "Try it now"}
              {!entering && <span className="transition-transform group-hover:translate-x-0.5">→</span>}
            </span>
          </button>
          <a href="https://github.com/IamNishant51/Synapse----Ai-" target="_blank" rel="noreferrer"
            className="px-7 py-3 rounded-lg border border-hairline text-sm text-ink-subtle hover:text-ink hover:bg-surface-1 transition-all cursor-pointer">
            View source
          </a>
        </div>

        <div className="scroll-hint absolute bottom-8 left-1/2 -translate-x-1/2 opacity-40 flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink-tertiary">Scroll</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </section>

      {/* ═══════════ 2 · THE PROBLEM ═══════════ */}
      <section id="sources" className="relative z-10 py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Your context lives in five different tabs.
          </h2>
          <p className="text-ink-muted text-sm mb-14 max-w-lg mx-auto">
            Decisions made in ChatGPT. Code pushed to GitHub. Notes buried in PDFs. None of them talk to each other — until now.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {SOURCES.map((s) => (
              <div key={s.name}
                className="src-pill flex items-center gap-2.5 px-5 py-3 rounded-xl bg-surface-1 border border-hairline hover:border-primary/30 transition-colors">
                <span className="text-base">{s.icon}</span>
                <span className="text-sm font-medium text-ink-muted">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 3 · INGEST (pinned) ═══════════ */}
      <section id="ingest" className="relative z-10 min-h-[70vh] flex items-center border-y border-hairline bg-surface-1/40">
        <div className="max-w-3xl mx-auto px-6 w-full py-20">
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-3">How it works</p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Feed it anything. It remembers.
          </h2>
          <p className="text-ink-muted text-sm mb-12 max-w-md">
            Drop a GitHub repo, a PDF, or a ChatGPT export. Synapse fetches, extracts entities, calls <code className="text-primary/80 text-xs">cognee.remember()</code>, then runs a reconciliation pass via <code className="text-primary/80 text-xs">cognee.improve()</code>.
          </p>

          {/* stepper */}
          <div className="relative flex items-start justify-between">
            {/* track */}
            <div className="absolute top-4 left-[12.5%] right-[12.5%] h-[2px] bg-surface-3 z-0" />
            <div className="prog-fill absolute top-4 left-[12.5%] h-[2px] w-0 bg-semantic-success z-[1]" />

            {STEPS.map((label, i) => (
              <div key={label} className={`step-${i + 1} flex-1 flex flex-col items-center gap-2 relative z-10`}>
                <div className="dot w-8 h-8 rounded-full border-2 border-hairline bg-surface-2 grid place-items-center text-[11px] font-mono text-ink-tertiary transition-all duration-300">
                  {i + 1}
                </div>
                <span className="lbl text-[11px] text-ink-tertiary font-medium transition-colors duration-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ 4 · CONFLICT RESOLUTION (pinned) ═══════════ */}
      <section id="conflict" className="relative z-10 min-h-screen flex items-center py-20">
        <div className="max-w-3xl mx-auto px-6 w-full">
          <p className="text-xs uppercase tracking-widest text-conflict-warning font-medium mb-3">The differentiator</p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Facts change. Synapse catches it.
          </h2>
          <p className="text-ink-muted text-sm mb-10 max-w-md">
            When new evidence contradicts what you previously believed, Synapse surfaces the conflict and lets you decide — not the machine.
          </p>

          {/* mock resolve card */}
          <div className="rounded-xl border border-hairline bg-surface-1 overflow-hidden shadow-2xl shadow-black/30">
            <div className="h-[3px] bg-gradient-to-r from-conflict-warning/80 to-conflict-warning/30" />
            <div className="p-6 md:p-8">
              {/* header */}
              <div className="flex items-center gap-2.5 mb-7">
                <div className="warn-badge w-5 h-5 rounded-full bg-conflict-warning/15 grid place-items-center">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#e0a328" strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5v.01" stroke="#e0a328" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <span className="text-sm font-medium">Conflict — Database choice</span>
              </div>

              {/* old vs new */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-7">
                <div className="card-old p-4 rounded-lg bg-surface-2/70 border border-hairline">
                  <span className="text-[10px] uppercase tracking-wider text-ink-tertiary block mb-1.5">Old belief</span>
                  <p className="text-sm text-ink-muted leading-snug">&quot;Using Postgres for the main datastore&quot;</p>
                  <span className="mt-2 inline-block text-[10px] text-ink-tertiary">Mar 2 — ChatGPT session</span>
                </div>
                <div className="card-new p-4 rounded-lg bg-surface-2/70 border border-primary/20">
                  <span className="text-[10px] uppercase tracking-wider text-primary block mb-1.5">New evidence</span>
                  <p className="text-sm text-ink-muted leading-snug">&quot;Switched everything to Supabase&quot;</p>
                  <span className="mt-2 inline-block text-[10px] text-ink-tertiary">Jun 20 — project-notes.md</span>
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center justify-center gap-2.5">
                <button className="px-4 py-1.5 rounded-md border border-hairline text-xs text-ink-subtle hover:bg-surface-2 transition-colors">Keep Old</button>
                <button className="act-new px-4 py-1.5 rounded-md bg-primary text-white text-xs font-medium">Keep New</button>
                <button className="px-4 py-1.5 rounded-md border border-hairline text-xs text-ink-subtle hover:bg-surface-2 transition-colors">Keep Both</button>
              </div>

              {/* diff */}
              <div className="diff-block mt-7 pt-6 border-t border-hairline">
                <p className="text-[10px] uppercase tracking-wider text-semantic-success mb-2">Decision recorded</p>
                <div className="rounded-md bg-canvas/60 border border-hairline p-3 font-mono text-xs leading-relaxed">
                  <span className="text-semantic-danger">− Postgres</span><br />
                  <span className="text-semantic-success">+ Supabase</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 5 · DECAY ═══════════ */}
      <section id="decay" className="relative z-10 py-28 px-6 border-t border-hairline">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-ink-tertiary font-medium mb-3">Memory health</p>
          <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            Beliefs that aren&apos;t reinforced fade.
          </h2>
          <p className="text-ink-muted text-sm mb-12 max-w-md">
            Confidence decays over time. When a belief goes unreinforced long enough, <code className="text-primary/80 text-xs">cognee.forget()</code> prunes it from the graph automatically.
          </p>

          <div className="space-y-6 max-w-xl">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-ink-subtle">Postgres · last seen 3 months ago</span>
                <span className="text-semantic-danger font-mono">0.12</span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="bar-stale h-full bg-semantic-danger/70 rounded-full w-[88%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-primary font-medium">Supabase · reinforced today</span>
                <span className="text-primary font-mono">0.95</span>
              </div>
              <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                <div className="bar-fresh h-full bg-primary rounded-full w-[8%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 6 · CTA ═══════════ */}
      <section className="relative z-10 py-32 px-6 flex flex-col items-center text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none">
          <div className="orb absolute inset-0 rounded-full bg-primary/15 blur-[90px]" />
        </div>

        <h2 className="relative z-10 text-3xl md:text-5xl font-bold tracking-tight mb-6 max-w-lg"
          style={{ fontFamily: "Outfit, sans-serif" }}>
          Stop re-explaining context.
        </h2>
        <p className="relative z-10 text-ink-muted text-sm mb-8 max-w-sm">
          Build a memory that reconciles, decays, and actually keeps up with you.
        </p>
        <button onClick={enter}
          className="relative z-10 px-7 py-3 rounded-lg bg-primary text-white text-sm font-medium hover:brightness-110 transition-all shadow-lg shadow-primary/20 cursor-pointer">
          Initialize Graph →
        </button>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-hairline py-6 bg-canvas">
        <p className="text-center text-[11px] text-ink-tertiary">
          Built for WeMakeDevs × Cognee Hackathon 2026 · Next.js · FastAPI · Cognee SDK · GSAP
        </p>
      </footer>
    </div>
  );
}
