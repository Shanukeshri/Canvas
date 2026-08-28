import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';

export const metadata: Metadata = {
  title: 'Zen Productivity Canvas — Quiet Focus Environment',
  description:
    'A quiet, minimalist productivity application designed around deep focus, independent timers, ambient soundscapes, and shared focus groups.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <ThemeProvider>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
