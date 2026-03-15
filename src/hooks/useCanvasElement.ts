'use client';

import { useCallback, useEffect, useRef } from 'react';
import { debounce, type DebouncedFunc } from 'lodash';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import type { CanvasElement, CanvasElementUpsert } from '../types/canvas.types';
import {
  deleteCanvasElement as deleteCanvasElementRequest,
  fetchCanvasElements,
  upsertCanvasElement as upsertCanvasElementRequest,
} from '../services/integration.service';

const DEBOUNCE_DELAY_UPSERT_CANVAS_ELEMENT = 250;

type UpsertOptions = {
  immediate?: boolean;
};

type UpsertQueueItem = {
  element: CanvasElementUpsert;
  onCreated?: (dbId: number, configDbId: number) => void;
};

type UseCanvasElementOptions = {
  canEdit?: boolean;
  enabled?: boolean;
};

function getUpsertKey(element: CanvasElementUpsert) {
  if (typeof element.id === 'number') {
    return `id:${element.id}`;
  }
  if (element.clientId) {
    return `client:${element.clientId}`;
  }
  if (typeof element.canvasElementConfigId === 'number') {
    return `cfg:${element.canvasElementConfigId}`;
  }
  return `fallback:${element.type}:${element.variableName ?? ''}`;
}

export function useCanvasElement(boardId: string, options?: UseCanvasElementOptions) {
  const canEdit = options?.canEdit ?? true;
  const enabled = options?.enabled ?? true;
  const queryClient = useQueryClient();
  const queuedUpsertsRef = useRef<Map<string, UpsertQueueItem>>(new Map());
  const debouncersRef = useRef<Map<string, DebouncedFunc<() => void>>>(new Map());

  const { data: canvasElements } = useQuery({
    queryKey: ['canvas-elements', boardId],
    queryFn: async () => {
      return fetchCanvasElements(boardId);
    },
    enabled: Boolean(boardId) && enabled,
    retry: (failureCount, error) => {
      const status = (error as AxiosError<{ error?: string }>)?.response?.status;

      if (status === 401 || status === 403 || status === 404) {
        return false;
      }

      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { mutate } = useMutation({
    mutationFn: upsertCanvasElementRequest,
    onSuccess: (canvasElement) => {
      if (!canvasElement?.id) return;
      queryClient.setQueryData(['canvas-elements', boardId], (oldData: CanvasElement[] = []) => {
        const exists = oldData.some((el) => el.id === canvasElement.id);
        if (exists) {
          return oldData.map((el) => (el.id === canvasElement.id ? canvasElement : el));
        }
        return [...oldData, canvasElement];
      });
    },
  });

  const flushUpsert = useCallback(
    (key: string) => {
      if (!canEdit) {
        queuedUpsertsRef.current.delete(key);
        return;
      }

      const queued = queuedUpsertsRef.current.get(key);
      if (!queued) {
        return;
      }

      queuedUpsertsRef.current.delete(key);
      mutate(queued.element, {
        onSuccess: (data) => {
          if (!queued.element.id) {
            queued.onCreated?.(data.id, data.canvasElementConfigId);
          }
        },
      });
    },
    [canEdit, mutate]
  );

  const upsertCanvasElement = useCallback(
    (
      element: CanvasElementUpsert,
      onCreated?: (dbId: number, configDbId: number) => void,
      options?: UpsertOptions
    ) => {
      if (!canEdit) {
        return;
      }

      const key = getUpsertKey(element);
      queuedUpsertsRef.current.set(key, { element, onCreated });

      let debouncer = debouncersRef.current.get(key);
      if (!debouncer) {
        debouncer = debounce(() => flushUpsert(key), DEBOUNCE_DELAY_UPSERT_CANVAS_ELEMENT);
        debouncersRef.current.set(key, debouncer);
      }

      if (options?.immediate) {
        debouncer.cancel();
        flushUpsert(key);
        return;
      }

      debouncer();
    },
    [canEdit, flushUpsert]
  );

  useEffect(() => {
    const debouncers = debouncersRef.current;
    const queuedUpserts = queuedUpsertsRef.current;

    return () => {
      for (const debouncer of debouncers.values()) {
        debouncer.cancel();
      }
      debouncers.clear();
      queuedUpserts.clear();
    };
  }, []);

  const { mutate: deleteCanvasElementMutation } = useMutation({
    mutationFn: deleteCanvasElementRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canvas-elements', boardId] });
    },
  });

  const deleteCanvasElement = useCallback(
    (
      id: number,
      mutationOptions?: {
        onSuccess?: () => void;
      }
    ) => {
      if (!canEdit) {
        return;
      }

      deleteCanvasElementMutation(id, mutationOptions);
    },
    [canEdit, deleteCanvasElementMutation]
  );

  return { canvasElements, upsertCanvasElement, deleteCanvasElement };
}
