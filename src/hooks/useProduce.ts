'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchProduceStatus, triggerProduce } from '../services/integration.service';
import type {
  GenerationJobStatus,
  MissingProducePrerequisite,
  ProduceApiError,
  ProduceStatusResponse,
  TriggerProduceResponse,
} from './produce.types';

const POLLING_INTERVAL_MS = 2_000;
const JOB_NOT_FOUND_RETRY_LIMIT = 2;

function toStorageKey(boardId: string) {
  return `produce-active-job:${boardId}`;
}

function isActiveStatus(status: GenerationJobStatus | null) {
  return status === 'QUEUED' || status === 'PROCESSING';
}

function extractErrorMessage(error: AxiosError<ProduceApiError>) {
  const responseError = error.response?.data.error;
  return responseError && responseError.length > 0
    ? responseError
    : error.message || 'Failed to process PDF generation';
}

export function useProduce(boardId?: string) {
  const queryClient = useQueryClient();
  const [activeJobsByBoard, setActiveJobsByBoard] = useState<Record<string, string>>({});

  const persistJobId = useCallback((targetBoardId: string, jobId: string | null) => {
    if (typeof window === 'undefined') return;

    const key = toStorageKey(targetBoardId);
    if (jobId) {
      window.localStorage.setItem(key, jobId);
      return;
    }
    window.localStorage.removeItem(key);
  }, []);

  const setActiveJobForBoard = useCallback(
    (jobId: string | null, targetBoardId = boardId) => {
      if (!targetBoardId) return;

      setActiveJobsByBoard((previous) => {
        const next = { ...previous };
        if (jobId) {
          next[targetBoardId] = jobId;
        } else {
          delete next[targetBoardId];
        }
        return next;
      });

      persistJobId(targetBoardId, jobId);
    },
    [boardId, persistJobId]
  );

  const activeJobId = boardId
    ? (activeJobsByBoard[boardId] ??
      (typeof window === 'undefined' ? null : window.localStorage.getItem(toStorageKey(boardId))))
    : null;

  const triggerMutation = useMutation<TriggerProduceResponse, AxiosError<ProduceApiError>, void>({
    onMutate: () => {
      setActiveJobForBoard(null);
    },
    mutationFn: async () => {
      if (!boardId) {
        throw new Error('Missing board id');
      }

      return triggerProduce(boardId);
    },
    onSuccess: (data) => {
      setActiveJobForBoard(data.jobId);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['billing', 'summary'] });
    },
  });

  const statusQuery = useQuery<ProduceStatusResponse, AxiosError<ProduceApiError>>({
    queryKey: ['produce-status', boardId, activeJobId],
    queryFn: async () => {
      if (!boardId || !activeJobId) {
        throw new Error('Missing board or job id');
      }

      const data = await fetchProduceStatus(boardId, activeJobId);

      if (data.jobId && data.jobId !== activeJobId) {
        setActiveJobForBoard(data.jobId);
      }

      return data;
    },
    enabled: Boolean(boardId && activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isActiveStatus(status) ? POLLING_INTERVAL_MS : false;
    },
    retry: (failureCount, error) => {
      if (error.response?.status === 404) {
        const shouldRetry = failureCount < JOB_NOT_FOUND_RETRY_LIMIT;
        if (!shouldRetry) {
          setActiveJobForBoard(null);
        }
        return shouldRetry;
      }
      return failureCount < 3;
    },
    retryDelay: (attempt, error) => {
      if (error.response?.status === 404) {
        return Math.min(500 * 2 ** attempt, 4_000);
      }
      return Math.min(1_000 * 2 ** attempt, 8_000);
    },
  });

  useEffect(() => {
    const status = statusQuery.data?.status;
    if (status !== 'READY' && status !== 'FAILED') {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ['billing', 'summary'] });
  }, [statusQuery.data?.status, boardId, activeJobId, queryClient]);

  const currentStatus = statusQuery.data?.status ?? triggerMutation.data?.status ?? null;

  const missingPrerequisites: MissingProducePrerequisite[] = (() => {
    const mutationError = triggerMutation.error;
    if (!mutationError) {
      return [];
    }
    const status = mutationError.response?.status;
    if (status !== 422) {
      return [];
    }
    return mutationError.response?.data.missing ?? [];
  })();

  const conflictJobId = (() => {
    const mutationError = triggerMutation.error;
    if (!mutationError) {
      return null;
    }
    const status = mutationError.response?.status;
    if (status !== 409) {
      return null;
    }
    return mutationError.response?.data.jobId ?? null;
  })();

  const derivedErrorMessage = useMemo(() => {
    if (statusQuery.error) {
      return extractErrorMessage(statusQuery.error);
    }

    if (triggerMutation.error) {
      return extractErrorMessage(triggerMutation.error);
    }

    return statusQuery.data?.errorMessage ?? null;
  }, [statusQuery.error, statusQuery.data, triggerMutation.error]);

  const isGenerating = isActiveStatus(currentStatus);

  const progress = statusQuery.data?.progress ?? triggerMutation.data?.progress ?? 0;

  const resumeFromJobId = useCallback(
    (jobId: string) => {
      setActiveJobForBoard(jobId);
    },
    [setActiveJobForBoard]
  );

  const clearActiveJob = useCallback(() => {
    setActiveJobForBoard(null);
  }, [setActiveJobForBoard]);

  return {
    activeJobId,
    status: currentStatus,
    progress,
    isGenerating,
    isTriggering: triggerMutation.isPending,
    isPolling: statusQuery.isFetching,
    downloadUrl: statusQuery.data?.downloadUrl,
    errorMessage: derivedErrorMessage,
    missingPrerequisites,
    conflictJobId,
    triggerGeneration: triggerMutation.mutateAsync,
    refetchStatus: statusQuery.refetch,
    resumeFromJobId,
    clearActiveJob,
  };
}
