'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';

import { setPersonalAccessToken } from '../services/personalAccessToken.service';
import { setApiBaseUrl } from '../lib/sdkConfig';

type FormiqProviderProps = {
  token: string;
  apiBaseUrl?: string;
  children: React.ReactNode;
};

export function FormiqProvider({ token, apiBaseUrl, children }: FormiqProviderProps) {
  const queryClientRef = useRef<QueryClient>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  const trimmedToken = token.trim();
  const trimmedApiBaseUrl = apiBaseUrl?.trim() ?? '';

  if (trimmedToken) setPersonalAccessToken(trimmedToken);
  if (trimmedApiBaseUrl) setApiBaseUrl(trimmedApiBaseUrl);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
