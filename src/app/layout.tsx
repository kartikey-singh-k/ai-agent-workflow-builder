'use client';

import './globals.css';
import { NhostProvider } from '@nhost/react';
import { nhost } from '@/lib/nhost';
import { ApolloProviderWrapper } from '@/lib/apollo';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">
        <NhostProvider nhost={nhost}>
          <ApolloProviderWrapper>
            <Navbar />
            <main className="max-w-7xl mx-auto p-6">{children}</main>
          </ApolloProviderWrapper>
        </NhostProvider>
      </body>
    </html>
  );
}