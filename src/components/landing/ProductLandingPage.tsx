'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Sparkles, ArrowRight, Play, CheckCircle2, Volume2, Users, BarChart3, ShieldCheck } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export function ProductLandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const { theme } = useTheme();
  const heroRef = useRef<HTMLDivElement>(null);
  const chaosRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const philosophyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register GSAP ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // ScrollTrigger timeline animations
    const ctx = gsap.context(() => {
      // Hero Timer Entrance
      gsap.from('.hero-timer-box', {
        scale: 0.8,
        opacity: 0,
        duration: 1.5,
        ease: 'power3.out',
      });

      // Chaos section items disperse
      gsap.to('.chaos-tag', {
        scrollTrigger: {
          trigger: chaosRef.current,
          start: 'top center',
          end: 'bottom top',
          scrub: 1,
        },
        x: (i) => (i % 2 === 0 ? -250 : 250),
        opacity: 0,
        stagger: 0.1,
      });

      // Typography words reveal
      gsap.from('.typo-word', {
        scrollTrigger: {
          trigger: typographyRef.current,
          start: 'top 75%',
          end: 'bottom 40%',
          scrub: 0.8,
        },
        y: 60,
        opacity: 0,
        stagger: 0.2,
      });

      // Sound Bars visualization wave
      gsap.to('.sound-bar-fill', {
        scrollTrigger: {
          trigger: soundRef.current,
          start: 'top 70%',
          end: 'center center',
          scrub: 1,
        },
        width: '100%',
        stagger: 0.15,
      });

      // Social bubbles convergence
      gsap.from('.social-bubble', {
        scrollTrigger: {
          trigger: socialRef.current,
          start: 'top 80%',
          end: 'center center',
          scrub: 1,
        },
        scale: 0.3,
        opacity: 0,
        stagger: 0.2,
      });
    });

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div className="w-full bg-zen-bg text-zen-text min-h-screen selection:bg-zen-accent selection:text-white overflow-x-hidden">
      {/* Subtle Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md bg-zen-bg/60 border-b border-zen-border/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-zen-accent-subtle border border-zen-accent/40 flex items-center justify-center text-zen-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-zen-text tracking-wide">
            Zen Focus
          </span>
        </div>

        <button
          onClick={onEnterApp}
          className="px-6 py-2.5 rounded-full bg-zen-accent text-white text-sm font-semibold shadow-lg shadow-zen-accent-glow hover:bg-zen-accent-hover transition-all flex items-center gap-2"
        >
          Enter Prototype <ArrowRight className="w-4 h-4" />
        </button>
      </nav>

      {/* 1. HERO — "Everything can wait." */}
      <section
        ref={heroRef}
        className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 relative"
      >
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-25 pointer-events-none"
          style={{ backgroundColor: theme.hex }}
        />

        <span className="text-xs font-semibold uppercase tracking-widest text-zen-accent mb-6 px-4 py-1.5 rounded-full bg-zen-accent-subtle border border-zen-accent/30">
          The Canvas is the Application
        </span>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold font-display tracking-tight text-zen-text max-w-4xl leading-none">
          Everything <br />
          <span className="text-zen-accent">can wait.</span>
        </h1>

        {/* Hero Timer Box Anchor */}
        <div className="hero-timer-box mt-12 w-64 h-64 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl bg-zen-card/80 transition-transform hover:scale-105"
          style={{ borderColor: theme.hex }}
        >
          <span className="font-mono text-5xl font-extrabold text-zen-text">25:00</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zen-accent mt-2">
            FOCUS
          </span>
        </div>

        <div className="mt-16 flex flex-col items-center text-xs text-zen-text-muted animate-bounce">
          <span>Scroll to enter state of focus</span>
          <span className="text-lg mt-1">↓</span>
        </div>
      </section>

      {/* 2. CHAOS → FOCUS */}
      <section
        ref={chaosRef}
        className="min-h-screen flex flex-col items-center justify-center relative px-4 py-24 text-center border-t border-zen-border/40"
      >
        <h2 className="text-3xl sm:text-5xl font-bold font-display text-zen-text max-w-2xl mb-12">
          There is always something asking for your attention.
        </h2>

        {/* Floating Chaos Badges that get pushed away on scroll */}
        <div className="relative w-full max-w-3xl h-64 flex items-center justify-center my-8">
          <span className="chaos-tag absolute top-0 left-10 px-4 py-2 rounded-2xl bg-zen-surface border border-zen-border text-sm text-zen-text-muted shadow-md">
            📧 Unread emails (42)
          </span>
          <span className="chaos-tag absolute top-8 right-12 px-4 py-2 rounded-2xl bg-zen-surface border border-zen-border text-sm text-zen-text-muted shadow-md">
            🔔 Slack notification
          </span>
          <span className="chaos-tag absolute bottom-4 left-16 px-4 py-2 rounded-2xl bg-zen-surface border border-zen-border text-sm text-zen-text-muted shadow-md">
            📅 Calendar reminder
          </span>
          <span className="chaos-tag absolute bottom-8 right-20 px-4 py-2 rounded-2xl bg-zen-surface border border-zen-border text-sm text-zen-text-muted shadow-md">
            💬 12 unread messages
          </span>

          <div className="w-48 h-48 rounded-full border-2 border-zen-accent flex flex-col items-center justify-center bg-zen-card shadow-2xl z-10">
            <span className="font-mono text-3xl font-bold text-zen-text">25:00</span>
            <span className="text-xs font-semibold text-zen-accent mt-1">FOCUS</span>
          </div>
        </div>

        <p className="text-2xl font-semibold text-zen-accent mt-8">
          You don't have to give it.
        </p>
      </section>

      {/* 3. "ONE THING AT A TIME" */}
      <section
        ref={typographyRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center bg-zen-surface/40 border-t border-zen-border/40"
      >
        <div className="flex flex-col gap-6 max-w-4xl">
          <span className="typo-word text-6xl sm:text-8xl font-black font-display text-zen-text">
            One thing.
          </span>
          <span className="typo-word text-6xl sm:text-8xl font-black font-display text-zen-accent">
            At a time.
          </span>
          <p className="typo-word text-xl text-zen-text-muted mt-6 max-w-xl mx-auto">
            Your tasks. Your time. Your attention. Kept clean and uncluttered.
          </p>
        </div>
      </section>

      {/* 4. SOUND MIXER PREVIEW */}
      <section
        ref={soundRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center border-t border-zen-border/40"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-zen-accent mb-4">
          Atmospheric Soundscapes
        </span>
        <h2 className="text-4xl sm:text-6xl font-bold font-display text-zen-text mb-12">
          Find your frequency.
        </h2>

        <div className="w-full max-w-lg flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-zen-card border border-zen-border text-left flex flex-col gap-2 shadow-lg">
            <div className="flex justify-between text-sm font-semibold text-zen-text">
              <span>Gentle Rain</span>
              <span className="text-zen-accent font-mono">65%</span>
            </div>
            <div className="h-2 w-full bg-zen-surface rounded-full overflow-hidden">
              <div className="sound-bar-fill h-full bg-zen-accent rounded-full w-0 transition-all" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zen-card border border-zen-border text-left flex flex-col gap-2 shadow-lg">
            <div className="flex justify-between text-sm font-semibold text-zen-text">
              <span>Cozy Fireplace</span>
              <span className="text-zen-accent font-mono">40%</span>
            </div>
            <div className="h-2 w-full bg-zen-surface rounded-full overflow-hidden">
              <div className="sound-bar-fill h-full bg-zen-accent rounded-full w-0 transition-all" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-zen-card border border-zen-border text-left flex flex-col gap-2 shadow-lg">
            <div className="flex justify-between text-sm font-semibold text-zen-text">
              <span>Deep Brown Noise</span>
              <span className="text-zen-accent font-mono">25%</span>
            </div>
            <div className="h-2 w-full bg-zen-surface rounded-full overflow-hidden">
              <div className="sound-bar-fill h-full bg-zen-accent rounded-full w-0 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. SOCIAL PRESENCE — "Focus together. Work separately." */}
      <section
        ref={socialRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center bg-zen-surface/40 border-t border-zen-border/40"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-zen-accent mb-4">
          Shared Focus Groups
        </span>
        <h2 className="text-4xl sm:text-6xl font-bold font-display text-zen-text max-w-3xl mb-6">
          Focus together. Work separately.
        </h2>
        <p className="text-lg text-zen-text-muted max-w-xl mb-12">
          Independent timers sharing space. No pressure, no comparison, just quiet group accountability.
        </p>

        {/* Member Orbital Bubbles Demonstration */}
        <div className="flex flex-wrap items-center justify-center gap-6 max-w-2xl">
          <div className="social-bubble p-4 rounded-3xl bg-zen-card border border-zen-accent flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-lg font-bold">
              👩🏻‍💻
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-zen-text">Sarah</span>
              <span className="text-xs font-mono text-zen-accent">18:42 FOCUS</span>
            </div>
          </div>

          <div className="social-bubble p-4 rounded-3xl bg-zen-card border border-zen-accent flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-lg font-bold">
              👨🏻‍🎨
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-zen-text">David</span>
              <span className="text-xs font-mono text-zen-accent">34:12 FOCUS</span>
            </div>
          </div>

          <div className="social-bubble p-4 rounded-3xl bg-zen-card border border-zen-accent flex items-center gap-3 shadow-xl">
            <div className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center text-lg font-bold">
              👩🏼‍🔬
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-zen-text">Elena</span>
              <span className="text-xs font-mono text-zen-accent">03:15 BREAK</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ZEN PHILOSOPHY */}
      <section
        ref={philosophyRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center border-t border-zen-border/40"
      >
        <div className="flex flex-col gap-4 text-4xl sm:text-6xl font-black font-display text-zen-text max-w-3xl">
          <span>No streaks.</span>
          <span>No scores.</span>
          <span>No pressure.</span>
          <span className="text-zen-accent">Just focus.</span>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-32 px-4 flex flex-col items-center justify-center text-center bg-zen-surface/60 border-t border-zen-border/40">
        <h2 className="text-4xl sm:text-6xl font-extrabold font-display text-zen-text mb-6">
          Ready to enter your canvas?
        </h2>
        <p className="text-base text-zen-text-muted max-w-md mb-10">
          Everything you need. Nothing in your way. Launch the interactive prototype now.
        </p>

        <button
          onClick={onEnterApp}
          className="px-10 py-5 rounded-full bg-zen-accent text-white text-lg font-extrabold shadow-2xl shadow-zen-accent-glow hover:bg-zen-accent-hover hover:scale-105 transition-all flex items-center gap-3"
        >
          Launch Interactive Prototype <ArrowRight className="w-6 h-6" />
        </button>
      </section>
    </div>
  );
}
