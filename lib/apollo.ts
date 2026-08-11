'use client';

import { NhostApolloProvider } from '@nhost/react-apollo';
import { nhost } from './nhost';
import React from 'react';

export function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NhostApolloProvider nhost={nhost}>
      {children}
    </NhostApolloProvider>
  );
}