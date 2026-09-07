'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { MainAppCanvas } from '@/components/MainAppCanvas';
import { ProductLandingPage } from '@/components/landing/ProductLandingPage';
import { Hourglass } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isCheckingAuth, openAuthModal } = useApp();
  const [explicitLandingView, setExplicitLandingView] = useState<boolean>(false);

  // Sync state if user logs out
  useEffect(() => {
    if (!isAuthenticated && !isCheckingAuth) {
      setExplicitLandingView(false);
    }
  }, [isAuthenticated, isCheckingAuth]);

  // Serene initial auth check state (prevents visual flashing)
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-canvas-bg select-none text-canvas-text">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Hourglass className="absolute w-5 h-5 text-indigo-400 animate-pulse" />
        </div>
      </div>
    );
  }

  // Flow rule 1 & 2: If unauthenticated (no token or expired refresh token), show Product Landing Page
  if (!isAuthenticated || explicitLandingView) {
    return (
      <ProductLandingPage
        onEnterApp={() => {
          if (isAuthenticated) {
            setExplicitLandingView(false);
          } else {
            openAuthModal('login');
          }
        }}
      />
    );
  }

  // Flow rule 3 & 4: Valid access token (or refreshed via refresh token), show main workspace
  return <MainAppCanvas onOpenProductPage={() => setExplicitLandingView(true)} />;
}
