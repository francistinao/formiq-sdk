'use client';

import { useQuery } from '@tanstack/react-query';

import { uploadAddedToken } from '../services/integration.service';
import type { CheckPatResponse } from '../types/pat.types';

export function useValidatePat(token?: string) {
  return useQuery<CheckPatResponse, Error>({
    queryKey: ['validate-pat', token],
    queryFn: () => uploadAddedToken(token ?? ''),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}
