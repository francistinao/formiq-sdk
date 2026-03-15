'use client';

import { useEffect, useMemo } from 'react';

import { setPersonalAccessToken } from '../services/personalAccessToken.service';

type FormiqProviderProps = {
  token: string;
  children: React.ReactNode;
};

export function FormiqProvider({ token, children }: FormiqProviderProps) {
  const stableToken = useMemo(() => token.trim(), [token]);

  useEffect(() => {
    if (!stableToken) return;
    setPersonalAccessToken(stableToken);
  }, [stableToken]);

  return <>{children}</>;
}
