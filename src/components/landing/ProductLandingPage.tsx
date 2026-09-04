'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Hourglass,
  ArrowRight,
  ChevronDown,
  Clock,
  Flame,
  CloudRain,
  Radio,
  LogIn,
} from 'lucide-react';
import clsx from 'clsx';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AuthModal } from '@/components/auth/AuthModal';

const SEGMENTS = [
  { id: 'hero', name: 'Start' },
  { id: 'chaos', name: 'Clarity' },
  { id: 'focus', name: 'One Thing' },
  { id: 'sound', name: 'Sound' },
  { id: 'social', name: 'Groups' },
  { id: 'cta', name: 'Launch' },
];

export function ProductLandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const { theme } = useTheme();
  const { openAuthModal, isAuthenticated, currentUser } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const chaosRef = useRef<HTMLDivElement>(null);
  const typographyRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const [activeSegment, setActiveSegment] = useState<number>(0);

  // Soundscape volume preview
  const [soundVolumes, setSoundVolumes] = useState<{ [key: string]: number }>({
    rain: 65,
    fire: 40,
    noise: 25,
  });

  const scrollToSegment = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-segment="${index}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    if (!container) return;

    // Set container as default scroller for GSAP ScrollTrigger
    ScrollTrigger.defaults({
      scroller: container,
    });

    const ctx = gsap.context(() => {
      // 1. Hero Timer entrance animation
      gsap.from('.hero-timer-box', {
        scale: 0.82,
        opacity: 0,
        duration: 1.3,
        ease: 'power3.out',
      });

      // 2. Chaos section: tags disperse outward as you scroll into the section
      gsap.fromTo(
        '.chaos-tag',
        {
          x: 0,
          opacity: 1,
          scale: 1,
        },
        {
          scrollTrigger: {
            trigger: chaosRef.current,
            start: 'top 75%',
            end: 'top 15%',
            scrub: 0.8,
          },
          x: (i) => (i % 2 === 0 ? -180 : 180),
          opacity: 0.35,
          scale: 0.9,
          stagger: 0.1,
        }
      );

      // 3. Typography words: reveal and rise with scroll
      gsap.from('.typo-word', {
        scrollTrigger: {
          trigger: typographyRef.current,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 0.8,
        },
        y: 60,
        opacity: 0,
        stagger: 0.2,
      });

      // 4. Sound bars: dynamically expand with scroll
      gsap.fromTo(
        '.sound-bar-fill',
        { width: '0%' },
        {
          scrollTrigger: {
            trigger: soundRef.current,
            start: 'top 75%',
            end: 'top 20%',
            scrub: 1,
          },
          width: (i) => (i === 0 ? '65%' : i === 1 ? '40%' : '25%'),
          stagger: 0.15,
        }
      );

      // 5. Social Presence: bubbles scale up and converge with scroll
      gsap.from('.social-bubble', {
        scrollTrigger: {
          trigger: socialRef.current,
          start: 'top 85%',
          end: 'top 25%',
          scrub: 1,
        },
        scale: 0.4,
        opacity: 0,
        y: 35,
        stagger: 0.15,
      });
    }, container);

    // Segment active tracking via IntersectionObserver
    const sections = container.querySelectorAll('[data-segment]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-segment'));
            if (!isNaN(index)) {
              setActiveSegment(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    // Refresh ScrollTrigger after elements paint
    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToSegment(Math.min(SEGMENTS.length - 1, activeSegment + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToSegment(Math.max(0, activeSegment - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSegment]);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-surface text-on-surface select-none selection:bg-primary selection:text-white relative"
      style={{ scrollbarWidth: 'none' }}
    >
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-4 backdrop-blur-xl bg-surface/80 border-b border-surface-variant/30">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border border-surface-variant/40 shadow-sm transition-transform hover:rotate-180 duration-500"
            style={{ backgroundColor: theme.hex + '15', color: theme.hex }}
          >
            <Hourglass className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg text-on-surface tracking-wide">
            Canvas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openAuthModal('login')}
            className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isAuthenticated ? currentUser?.name || 'Account' : 'Sign In'}</span>
          </button>

          <button
            onClick={onEnterApp}
            className="px-5 py-2 rounded-full text-white text-xs font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: theme.hex }}
          >
            Enter Canvas Workspace <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Segment Side Pagination Dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
        {SEGMENTS.map((seg, idx) => (
          <button
            key={seg.id}
            onClick={() => scrollToSegment(idx)}
            className="group flex items-center justify-end gap-2.5 cursor-pointer py-1"
            aria-label={`Jump to segment ${seg.name}`}
          >
            <span
              className={clsx(
                'text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 px-2 py-0.5 rounded-md bg-surface-container/90 border border-surface-variant/40 shadow-sm whitespace-nowrap',
                activeSegment === idx
                  ? 'opacity-100 text-on-surface translate-x-0'
                  : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 text-outline'
              )}
            >
              {seg.name}
            </span>
            <div
              className={clsx(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                activeSegment === idx
                  ? 'scale-125 ring-4 ring-primary/20'
                  : 'bg-outline-variant hover:bg-outline'
              )}
              style={{
                backgroundColor: activeSegment === idx ? theme.hex : undefined,
              }}
            />
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SEGMENT 0: HERO — "Everything can wait." */}
      {/* ============================================================ */}
      <section
        ref={heroRef}
        data-segment="0"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center relative px-6 text-center overflow-hidden pt-16"
      >
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none"
          style={{ backgroundColor: theme.hex }}
        />

        <div className="flex flex-col items-center max-w-4xl z-10">
          <span
            className="text-[11px] font-bold uppercase tracking-widest mb-6 px-4 py-1.5 rounded-full border shadow-sm"
            style={{
              backgroundColor: theme.hex + '15',
              borderColor: theme.hex + '35',
              color: theme.hex,
            }}
          >
            The Canvas is the Application
          </span>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-on-surface leading-none">
            Everything <br />
            <span style={{ color: theme.hex }}>can wait.</span>
          </h1>

          {/* Focal Timer Anchor */}
          <div
            className="hero-timer-box mt-10 w-56 h-56 sm:w-60 sm:h-60 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl backdrop-blur-2xl bg-surface-container-low/90 transition-transform hover:scale-105"
            style={{ borderColor: theme.hex }}
          >
            <span className="font-mono text-5xl font-extrabold text-on-surface tracking-tight">
              25:00
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              <Hourglass className="w-3.5 h-3.5" style={{ color: theme.hex }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: theme.hex }}
              >
                FOCUS
              </span>
            </div>
          </div>
        </div>

        {/* Snap Down Action */}
        <button
          onClick={() => scrollToSegment(1)}
          className="absolute bottom-6 flex flex-col items-center gap-1 text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer group"
        >
          <span>Scroll to snap through segments</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 1: CHAOS TO CLARITY (Storytelling Dispersal) */}
      {/* ============================================================ */}
      <section
        ref={chaosRef}
        data-segment="1"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center relative px-6 text-center overflow-hidden border-t border-surface-variant/30 pt-16"
      >
        <div className="max-w-4xl flex flex-col items-center z-10">
          <span
            className="text-[11px] font-bold uppercase tracking-widest mb-4 px-3.5 py-1 rounded-full border"
            style={{
              backgroundColor: theme.hex + '15',
              borderColor: theme.hex + '30',
              color: theme.hex,
            }}
          >
            Digital Noise vs Deep Focus
          </span>

          <h2 className="text-3xl sm:text-5xl font-bold font-display text-on-surface max-w-2xl mb-8 leading-tight">
            There is always something asking for your attention.
          </h2>

          {/* Floating Chaos Badges that disperse on scroll */}
          <div className="relative w-full max-w-2xl h-56 flex items-center justify-center my-4">
            <span className="chaos-tag absolute top-2 left-4 sm:left-12 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant/70 text-xs text-outline shadow-md backdrop-blur-sm">
              📧 Unread emails (42)
            </span>
            <span className="chaos-tag absolute top-4 right-4 sm:right-10 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant/70 text-xs text-outline shadow-md backdrop-blur-sm">
              🔔 Slack notification
            </span>
            <span className="chaos-tag absolute bottom-4 left-6 sm:left-16 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant/70 text-xs text-outline shadow-md backdrop-blur-sm">
              📅 Calendar reminder
            </span>
            <span className="chaos-tag absolute bottom-2 right-6 sm:right-14 px-4 py-2 rounded-2xl bg-surface-container border border-surface-variant/70 text-xs text-outline shadow-md backdrop-blur-sm">
              💬 12 unread messages
            </span>

            {/* Calm Center Focus Island */}
            <div
              className="w-44 h-44 rounded-full border-2 flex flex-col items-center justify-center bg-surface-container-low shadow-2xl z-10 transition-transform hover:scale-105"
              style={{ borderColor: theme.hex }}
            >
              <span className="font-mono text-3xl font-extrabold text-on-surface">25:00</span>
              <span
                className="text-[11px] font-bold mt-1 uppercase tracking-widest"
                style={{ color: theme.hex }}
              >
                CALM CANVAS
              </span>
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-bold mt-6" style={{ color: theme.hex }}>
            You don't have to give it.
          </p>
        </div>

        <button
          onClick={() => scrollToSegment(2)}
          className="absolute bottom-6 flex flex-col items-center gap-1 text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer group"
        >
          <span>Single Tasking</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 2: "ONE THING AT A TIME" (Storytelling Typography) */}
      {/* ============================================================ */}
      <section
        ref={typographyRef}
        data-segment="2"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center bg-surface-container-low/40 border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div className="flex flex-col items-center gap-6 max-w-4xl z-10">
          <div className="flex flex-col">
            <span className="typo-word text-5xl sm:text-7xl md:text-8xl font-black font-display text-on-surface tracking-tight">
              One thing.
            </span>
            <span
              className="typo-word text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight"
              style={{ color: theme.hex }}
            >
              At a time.
            </span>
          </div>

          <p className="typo-word text-base sm:text-lg text-outline max-w-xl mx-auto leading-relaxed">
            Your tasks. Your time. Your attention. Kept clean, intentional, and uncluttered.
          </p>

          {/* Minimalist Task Preview Card */}
          <div className="typo-word w-full max-w-md mt-4 p-5 rounded-3xl bg-surface-container-low border border-surface-variant/60 shadow-xl text-left flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: theme.hex + '20', color: theme.hex }}
              >
                Active Priority
              </span>
              <span className="text-xs font-mono text-outline flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 18:40 remaining
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-md border flex items-center justify-center"
                style={{ borderColor: theme.hex, color: theme.hex }}
              >
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: theme.hex }} />
              </div>
              <span className="text-sm font-bold text-on-surface">
                Complete system architecture refactor
              </span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '75%', backgroundColor: theme.hex }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => scrollToSegment(3)}
          className="absolute bottom-6 flex flex-col items-center gap-1 text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer group"
        >
          <span>Soundscapes</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 3: ATMOSPHERIC SOUNDSCAPES (Storytelling Sound Wave) */}
      {/* ============================================================ */}
      <section
        ref={soundRef}
        data-segment="3"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div className="max-w-xl w-full flex flex-col items-center z-10">
          <span
            className="text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: theme.hex + '15',
              borderColor: theme.hex + '30',
              color: theme.hex,
            }}
          >
            Atmospheric Soundscapes
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-on-surface mb-8">
            Find your frequency.
          </h2>

          <div className="w-full flex flex-col gap-3.5">
            {[
              { id: 'rain', name: 'Gentle Rain', icon: CloudRain, defaultVol: 65 },
              { id: 'fire', name: 'Cozy Fireplace', icon: Flame, defaultVol: 40 },
              { id: 'noise', name: 'Deep Brown Noise', icon: Radio, defaultVol: 25 },
            ].map((s) => {
              const Icon = s.icon;
              const vol = soundVolumes[s.id] ?? s.defaultVol;
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-surface-container-low/80 border border-surface-variant/50 text-left flex flex-col gap-2.5 shadow-lg transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" style={{ color: theme.hex }} />
                      <span>{s.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold" style={{ color: theme.hex }}>
                      {vol}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="sound-bar-fill h-full rounded-full transition-all"
                      style={{ backgroundColor: theme.hex }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => scrollToSegment(4)}
          className="absolute bottom-6 flex flex-col items-center gap-1 text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer group"
        >
          <span>Shared Focus Groups</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 4: SHARED FOCUS GROUPS (Storytelling Bubble Convergence) */}
      {/* ============================================================ */}
      <section
        ref={socialRef}
        data-segment="4"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center bg-surface-container-low/40 border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div className="max-w-3xl flex flex-col items-center z-10">
          <span
            className="text-[11px] font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: theme.hex + '15',
              borderColor: theme.hex + '30',
              color: theme.hex,
            }}
          >
            Shared Focus Groups
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold font-display text-on-surface mb-4">
            Focus together. Work separately.
          </h2>
          <p className="text-sm sm:text-base text-outline max-w-xl mb-10 leading-relaxed">
            Independent timers sharing space. No pressure, no comparison, just quiet group
            accountability.
          </p>

          {/* Member orbital bubbles demonstration with storytelling convergence */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 max-w-2xl">
            {[
              { name: 'Sarah', avatar: '👩🏻‍💻', color: '#9333ea', timer: '18:42 FOCUS' },
              { name: 'David', avatar: '👨🏻‍🎨', color: '#f59e0b', timer: '34:12 FOCUS' },
              { name: 'Elena', avatar: '👩🏼‍🔬', color: '#14b8a6', timer: '03:15 BREAK' },
            ].map((m, idx) => (
              <div
                key={idx}
                className="social-bubble p-4 rounded-3xl bg-surface-container-low border border-surface-variant/60 flex items-center gap-3.5 shadow-xl transition-transform hover:scale-105"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm"
                  style={{ backgroundColor: m.color + '20', borderColor: m.color }}
                >
                  {m.avatar}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-on-surface">{m.name}</span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: theme.hex }}>
                    {m.timer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => scrollToSegment(5)}
          className="absolute bottom-6 flex flex-col items-center gap-1 text-xs font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer group"
        >
          <span>Launch Canvas</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
        </button>
      </section>

      {/* ============================================================ */}
      {/* SEGMENT 5: LAUNCH CANVAS (FINAL CTA) */}
      {/* ============================================================ */}
      <section
        ref={ctaRef}
        data-segment="5"
        className="h-screen w-full snap-start snap-always shrink-0 flex flex-col items-center justify-center px-6 text-center border-t border-surface-variant/30 relative overflow-hidden pt-16"
      >
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 pointer-events-none"
          style={{ backgroundColor: theme.hex }}
        />

        <div className="max-w-xl flex flex-col items-center z-10">
          <div
            className="w-16 h-16 rounded-3xl flex items-center justify-center border-2 border-surface-variant/40 shadow-xl mb-6 transition-transform hover:rotate-180 duration-500"
            style={{ backgroundColor: theme.hex + '20', color: theme.hex }}
          >
            <Hourglass className="w-8 h-8" />
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold font-display text-on-surface mb-5 tracking-tight">
            Ready to enter your canvas?
          </h2>
          <p className="text-sm sm:text-base text-outline max-w-md mb-10 leading-relaxed">
            Everything you need. Nothing in your way. Step into deep focus now.
          </p>

          <button
            onClick={onEnterApp}
            className="px-8 py-4 rounded-full text-white text-base font-extrabold shadow-2xl hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
            style={{ backgroundColor: theme.hex }}
          >
            Launch Canvas Workspace <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
}
