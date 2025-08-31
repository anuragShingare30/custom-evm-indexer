'use client';

import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/app/lib/apollo-client';

interface ApolloWrapperProps {
  children: React.ReactNode;
}

export function ApolloWrapper({ children }: ApolloWrapperProps) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}
