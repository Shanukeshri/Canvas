'use client';

import React, { useState } from 'react';
import { MainAppCanvas } from '@/components/MainAppCanvas';
import { ProductLandingPage } from '@/components/landing/ProductLandingPage';

export default function Home() {
  const [viewMode, setViewMode] = useState<'app' | 'landing'>('app');

  if (viewMode === 'landing') {
    return <ProductLandingPage onEnterApp={() => setViewMode('app')} />;
  }

  return <MainAppCanvas onBackToLanding={() => setViewMode('landing')} />;
}
