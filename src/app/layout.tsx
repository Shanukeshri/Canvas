import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Canvas-Productivity',
  description:
    'A quiet, minimalist productivity application designed around deep focus, independent timers, ambient soundscapes, and shared focus groups.',
  openGraph: {
    title: 'Canvas',
    description: 'Minimalist quiet focus environment with independent timers and soundscapes',
    siteName: 'Canvas',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <QueryProvider>
          <ThemeProvider>
            <AppProvider>{children}</AppProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
