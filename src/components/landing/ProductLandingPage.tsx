'use client';

import React, { useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Volume2,
  Users,
  BarChart3,
  ShieldCheck,
  Timer,
  Check,
  Flame,
  LayoutGrid,
} from 'lucide-react';
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
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

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
    <div className="w-full bg-surface text-on-surface min-h-screen selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Subtle Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 backdrop-blur-xl bg-surface/75 border-b border-surface-variant/30">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm"
            style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-on-surface tracking-wide">
            Zen Focus
          </span>
        </div>

        <button
          onClick={onEnterApp}
          className="px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
          style={{ backgroundColor: theme.hex }}
        >
          Enter Focus Workspace <ArrowRight className="w-4 h-4" />
        </button>
      </nav>

      {/* 1. HERO — "Everything can wait." */}
      <section
        ref={heroRef}
        className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 relative"
      >
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 pointer-events-none"
          style={{ backgroundColor: theme.hex }}
        />

        <span
          className="text-xs font-bold uppercase tracking-widest mb-6 px-4 py-1.5 rounded-full border shadow-sm"
          style={{
            backgroundColor: theme.hex + '15',
            borderColor: theme.hex + '40',
            color: theme.hex,
          }}
        >
          The Canvas is the Application
        </span>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-on-surface max-w-4xl leading-none">
          Everything <br />
          <span style={{ color: theme.hex }}>can wait.</span>
        </h1>

        {/* Hero Timer Box Anchor */}
        <div
          className="hero-timer-box mt-12 w-64 h-64 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-2xl bg-surface-container-low/80 transition-transform hover:scale-105"
          style={{ borderColor: theme.hex }}
        >
          <span className="font-mono text-5xl font-extrabold text-on-surface">25:00</span>
          <span
            className="text-xs font-bold uppercase tracking-widest mt-2"
            style={{ color: theme.hex }}
          >
            FOCUS
          </span>
        </div>

        <div className="mt-16 flex flex-col items-center text-xs text-outline animate-bounce">
          <span>Scroll to enter deep focus</span>
          <span className="text-lg mt-1">↓</span>
        </div>
      </section>

      {/* 2. CHAOS → FOCUS */}
      <section
        ref={chaosRef}
        className="min-h-screen flex flex-col items-center justify-center relative px-4 py-24 text-center border-t border-surface-variant/30"
      >
        <h2 className="text-3xl sm:text-5xl font-bold font-display text-on-surface max-w-2xl mb-12">
          There is always something asking for your attention.
        </h2>

        {/* Floating Chaos Badges that get pushed away on scroll */}
        <div className="relative w-full max-w-3xl h-64 flex items-center justify-center my-8">
          <span className="chaos-tag absolute top-0 left-10 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant text-xs text-outline shadow-md">
            📧 Unread emails (42)
          </span>
          <span className="chaos-tag absolute top-8 right-12 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant text-xs text-outline shadow-md">
            🔔 Slack notification
          </span>
          <span className="chaos-tag absolute bottom-4 left-16 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant text-xs text-outline shadow-md">
            📅 Calendar reminder
          </span>
          <span className="chaos-tag absolute bottom-8 right-20 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant text-xs text-outline shadow-md">
            💬 12 unread messages
          </span>

          <div
            className="w-48 h-48 rounded-full border-2 flex flex-col items-center justify-center bg-surface-container-low shadow-2xl z-10"
            style={{ borderColor: theme.hex }}
          >
            <span className="font-mono text-3xl font-bold text-on-surface">25:00</span>
            <span
              className="text-xs font-semibold mt-1 uppercase tracking-wider"
              style={{ color: theme.hex }}
            >
              FOCUS
            </span>
          </div>
        </div>

        <p className="text-2xl font-bold mt-8" style={{ color: theme.hex }}>
          You don't have to give it.
        </p>
      </section>

      {/* 3. "ONE THING AT A TIME" */}
      <section
        ref={typographyRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center bg-surface-container-low/40 border-t border-surface-variant/30"
      >
        <div className="flex flex-col gap-6 max-w-4xl">
          <span className="typo-word text-6xl sm:text-8xl font-black font-display text-on-surface">
            One thing.
          </span>
          <span
            className="typo-word text-6xl sm:text-8xl font-black font-display"
            style={{ color: theme.hex }}
          >
            At a time.
          </span>
          <p className="typo-word text-lg text-outline mt-6 max-w-xl mx-auto leading-relaxed">
            Your tasks. Your time. Your attention. Kept clean and uncluttered.
          </p>
        </div>
      </section>

      {/* 4. SOUND MIXER PREVIEW */}
      <section
        ref={soundRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center border-t border-surface-variant/30"
      >
        <span
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: theme.hex }}
        >
          Atmospheric Soundscapes
        </span>
        <h2 className="text-4xl sm:text-6xl font-bold font-display text-on-surface mb-12">
          Find your frequency.
        </h2>

        <div className="w-full max-w-lg flex flex-col gap-3.5">
          {[
            { name: 'Gentle Rain', vol: 65 },
            { name: 'Cozy Fireplace', vol: 40 },
            { name: 'Deep Brown Noise', vol: 25 },
          ].map((s, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-container-low/80 border border-surface-variant/40 text-left flex flex-col gap-2 shadow-lg"
            >
              <div className="flex justify-between text-xs font-semibold text-on-surface">
                <span>{s.name}</span>
                <span className="font-mono" style={{ color: theme.hex }}>
                  {s.vol}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="sound-bar-fill h-full rounded-full w-0 transition-all"
                  style={{ backgroundColor: theme.hex }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SOCIAL PRESENCE — "Focus together. Work separately." */}
      <section
        ref={socialRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center bg-surface-container-low/40 border-t border-surface-variant/30"
      >
        <span
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: theme.hex }}
        >
          Shared Focus Groups
        </span>
        <h2 className="text-4xl sm:text-6xl font-bold font-display text-on-surface max-w-3xl mb-6">
          Focus together. Work separately.
        </h2>
        <p className="text-base text-outline max-w-xl mb-12 leading-relaxed">
          Independent timers sharing space. No pressure, no comparison, just quiet group accountability.
        </p>

        {/* Member Orbital Bubbles Demonstration */}
        <div className="flex flex-wrap items-center justify-center gap-6 max-w-2xl">
          {[
            { name: 'Sarah', avatar: '👩🏻‍💻', color: '#9333ea', timer: '18:42 FOCUS' },
            { name: 'David', avatar: '👨🏻‍🎨', color: '#f59e0b', timer: '34:12 FOCUS' },
            { name: 'Elena', avatar: '👩🏼‍🔬', color: '#14b8a6', timer: '03:15 BREAK' },
          ].map((m, idx) => (
            <div
              key={idx}
              className="social-bubble p-4 rounded-3xl bg-surface-container-low border border-surface-variant/50 flex items-center gap-3 shadow-xl"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm"
                style={{ backgroundColor: m.color + '25', borderColor: m.color }}
              >
                {m.avatar}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface">{m.name}</span>
                <span className="text-[11px] font-mono" style={{ color: theme.hex }}>
                  {m.timer}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. ZEN PHILOSOPHY */}
      <section
        ref={philosophyRef}
        className="min-h-screen flex flex-col items-center justify-center px-4 py-24 text-center border-t border-surface-variant/30"
      >
        <div className="flex flex-col gap-4 text-4xl sm:text-6xl font-black font-display text-on-surface max-w-3xl">
          <span>No streaks.</span>
          <span>No scores.</span>
          <span>No pressure.</span>
          <span style={{ color: theme.hex }}>Just focus.</span>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-32 px-4 flex flex-col items-center justify-center text-center bg-surface-container-low/60 border-t border-surface-variant/30">
        <h2 className="text-4xl sm:text-6xl font-extrabold font-display text-on-surface mb-6">
          Ready to enter your canvas?
        </h2>
        <p className="text-sm text-outline max-w-md mb-10 leading-relaxed">
          Everything you need. Nothing in your way. Launch the interactive prototype now.
        </p>

        <button
          onClick={onEnterApp}
          className="px-10 py-4 rounded-full text-white text-base font-extrabold shadow-2xl hover:opacity-90 hover:scale-105 transition-all flex items-center gap-3"
          style={{ backgroundColor: theme.hex }}
        >
          Launch Interactive Prototype <ArrowRight className="w-5 h-5" />
        </button>
      </section>
    </div>
  );
}
