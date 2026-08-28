'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { X } from 'lucide-react';

export function StatisticsOverlay() {
  const { overlay, closeOverlay, totalFocusMinutesToday } = useApp();

  if (overlay !== 'stats') return null;

  const hoursToday = (totalFocusMinutesToday / 60).toFixed(0);
  const minutesToday = totalFocusMinutesToday % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter bg-surface-dim/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] p-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative flex flex-col gap-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-md">
          <h1 className="font-headline-lg text-headline-lg text-primary">Statistics</h1>
          <button
            onClick={closeOverlay}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Metric */}
        <div className="flex flex-col items-center justify-center py-md">
          <span className="font-display text-[64px] leading-none text-primary tracking-tight font-semibold">
            {hoursToday}h {minutesToday}m
          </span>
          <span className="font-body-lg text-body-lg text-on-surface-variant mt-sm">focus today</span>
        </div>

        {/* Bento Grid Layout matching productivity_insights_crimson/screen.png */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
          {/* Weekly Focus Graph */}
          <div className="lg:col-span-2 border border-outline-variant/50 rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.02)] p-xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-xl">
              <h3 className="font-headline-md text-headline-md text-primary">Weekly Overview</h3>
              <span className="px-3 py-1 bg-primary/10 text-primary font-label-md text-label-md rounded-full">
                This Week
              </span>
            </div>

            {/* Minimalist Bar Chart */}
            <div className="flex items-end justify-between h-48 gap-xs px-md pt-4">
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[40px] bg-surface-variant rounded-t-sm h-[40%] group-hover:bg-primary-fixed-dim transition-all relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 font-label-md text-label-md text-on-surface-variant whitespace-nowrap transition-opacity">
                    2h 10m
                  </div>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">M</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[40px] bg-surface-variant rounded-t-sm h-[70%] group-hover:bg-primary-fixed-dim transition-all relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 font-label-md text-label-md text-on-surface-variant whitespace-nowrap transition-opacity">
                    4h 30m
                  </div>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">T</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[40px] bg-primary rounded-t-sm h-[90%] relative shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 font-label-md text-label-md text-primary font-bold whitespace-nowrap">
                    3h 42m
                  </div>
                </div>
                <span className="font-label-md text-label-md text-primary font-bold mt-sm">W</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[40px] bg-surface-variant rounded-t-sm h-[30%] group-hover:bg-primary-fixed-dim transition-all relative"></div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">T</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[40px] bg-surface-variant rounded-t-sm h-[50%] group-hover:bg-primary-fixed-dim transition-all relative"></div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">F</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[40px] bg-surface-variant/40 rounded-t-sm h-[15%] group-hover:bg-primary-fixed-dim transition-all relative"></div>
                <span className="font-label-md text-label-md text-outline mt-sm">S</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[40px] bg-surface-variant/40 rounded-t-sm h-[20%] group-hover:bg-primary-fixed-dim transition-all relative"></div>
                <span className="font-label-md text-label-md text-outline mt-sm">S</span>
              </div>
            </div>
          </div>

          {/* Breakdown / KPIs */}
          <div className="flex flex-col gap-lg">
            {/* KPI 1 */}
            <div className="border border-outline-variant/50 rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.02)] p-xl flex-1 flex flex-col justify-center">
              <span className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-widest text-[11px]">
                Total Productive Time
              </span>
              <div className="flex items-baseline gap-xs mt-sm">
                <span className="font-display text-[40px] leading-none text-primary font-semibold">14h</span>
                <span className="font-body-lg text-body-lg text-on-surface-variant">20m</span>
              </div>
            </div>

            {/* KPI 2 & 3 row */}
            <div className="flex gap-lg flex-1">
              <div className="border border-outline-variant/50 rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.02)] p-lg lg:p-xl flex-1 flex flex-col justify-center">
                <span className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-widest text-[10px]">
                  Sessions
                </span>
                <span className="font-headline-lg text-headline-lg text-primary mt-sm">12</span>
              </div>
              <div className="border border-outline-variant/50 rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.02)] p-lg lg:p-xl flex-1 flex flex-col justify-center">
                <span className="font-label-md text-label-md text-on-surface-variant mb-sm uppercase tracking-widest text-[10px]">
                  Tasks
                </span>
                <span className="font-headline-lg text-headline-lg text-primary mt-sm">8</span>
              </div>
            </div>
          </div>

          {/* Topics Completed per Day */}
          <div className="lg:col-span-3 border border-outline-variant/50 rounded-xl bg-surface-container-lowest shadow-[0px_4px_20px_rgba(0,0,0,0.02)] p-xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-xl">
              <h3 className="font-headline-md text-headline-md text-primary">Topics Completed per Day</h3>
              <span className="px-3 py-1 bg-surface-variant text-on-surface-variant font-label-md text-label-md rounded-full">
                Last 7 Days
              </span>
            </div>
            <div className="flex items-end justify-between h-36 gap-xs px-md">
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[24px] bg-secondary-fixed-dim rounded-full h-[30%] group-hover:bg-primary-fixed transition-all relative"></div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">M</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[24px] bg-secondary-fixed-dim rounded-full h-[60%] group-hover:bg-primary-fixed transition-all relative"></div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">T</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[24px] bg-primary rounded-full h-[100%] relative shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"></div>
                <span className="font-label-md text-label-md text-primary font-bold mt-sm">W</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[24px] bg-secondary-fixed-dim rounded-full h-[40%] group-hover:bg-primary-fixed transition-all relative"></div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">T</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[24px] bg-secondary-fixed-dim rounded-full h-[70%] group-hover:bg-primary-fixed transition-all relative"></div>
                <span className="font-label-md text-label-md text-on-surface-variant mt-sm">F</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[24px] bg-surface-variant rounded-full h-[20%] group-hover:bg-primary-fixed transition-all relative"></div>
                <span className="font-label-md text-label-md text-outline mt-sm">S</span>
              </div>
              <div className="flex flex-col items-center gap-sm flex-1 group">
                <div className="w-full max-w-[24px] bg-surface-variant rounded-full h-[10%] group-hover:bg-primary-fixed transition-all relative"></div>
                <span className="font-label-md text-label-md text-outline mt-sm">S</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
