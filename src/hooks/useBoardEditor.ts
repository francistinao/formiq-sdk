'use client';

import { AxiosError } from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';

import { fetchBoard, toggleGenerateLink } from '../services/integration.service';
import type { BoardEditorPayload, BoardAccessRole } from '../types/board.types';

export function resolveBoardAccessRole(
  board: BoardEditorPayload['board'] | undefined,
  currentUserId: number | undefined
): BoardAccessRole {
  if (!board || !currentUserId) {
    return null;
  }

  if (board.userId === currentUserId) {
    return 'owner';
  }

  const membership = (board.collaboration?.collaborators ?? []).find(
    (collaborator) =>
      collaborator.userId === currentUserId && collaborator.invitationStatus === 'ACCEPTED'
  );

  return membership?.role ?? null;
}

export function canEditBoard(
  board: BoardEditorPayload['board'] | undefined,
  currentUserId: number | undefined
) {
  const role = resolveBoardAccessRole(board, currentUserId);
  return role === 'owner' || role === 'editor';
}

export function useBoardEditor(boardId?: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: ['board-editor', boardId],
    queryFn: async () => {
      if (!boardId) {
        throw new Error('Missing board id');
      }
      return fetchBoard(boardId);
    },
    enabled: Boolean(boardId) && enabled,
    retry: (failureCount, error) => {
      const status = (error as AxiosError<{ error?: string }>)?.response?.status;

      if (status === 401 || status === 403) {
        return false;
      }

      if (status === 404) {
        return failureCount < 3;
      }

      return failureCount < 2;
    },
    retryDelay: (attempt, error) => {
      const status = (error as AxiosError<{ error?: string }>)?.response?.status;
      if (status === 404) {
        return Math.min(300 * 2 ** attempt, 2_000);
      }
      return Math.min(1_000 * 2 ** attempt, 8_000);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
  });
}

export function useToggleGenerateLink(boardId?: string) {
  return useMutation({
    mutationFn: async () => {
      if (!boardId) {
        throw new Error('Missing board id');
      }
      return toggleGenerateLink(boardId);
    },
    retry: 1,
  });
}
