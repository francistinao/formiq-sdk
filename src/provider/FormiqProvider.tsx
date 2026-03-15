'use client';

import { useEffect, useMemo } from 'react';

import { setPersonalAccessToken } from '../services/personalAccessToken.service';
import { setApiBaseUrl } from '../lib/sdkConfig';

type FormiqProviderProps = {
  token: string;
  apiBaseUrl?: string;
  children: React.ReactNode;
};

export function FormiqProvider({ token, apiBaseUrl, children }: FormiqProviderProps) {
  const stableToken = useMemo(() => token.trim(), [token]);
  const stableApiBaseUrl = useMemo(() => apiBaseUrl?.trim() ?? '', [apiBaseUrl]);

  useEffect(() => {
    if (!stableToken) return;
    setPersonalAccessToken(stableToken);
  }, [stableToken]);

  useEffect(() => {
    if (!stableApiBaseUrl) return;
    setApiBaseUrl(stableApiBaseUrl);
  }, [stableApiBaseUrl]);

  return <>{children}</>;
}
