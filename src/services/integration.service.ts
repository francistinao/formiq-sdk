import api from '../lib/api';
import type { CheckPatResponse } from '../types/pat.types';
import type { BoardEditorPayload } from '../types/board.types';
import type { CanvasElement, CanvasElementUpsert } from '../types/canvas.types';
import type { ProduceStatusResponse, TriggerProduceResponse } from '../hooks/produce.types';

export const uploadAddedToken = async (token: string) => {
  if (!token) {
    throw new Error('token must be provided');
  }

  const res = await api.get<CheckPatResponse>('/integrations/validate-pat', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const fetchBoard = async (boardId: string) => {
  if (!boardId) {
    throw new Error('boardId must be provided');
  }

  const res = await api.get<BoardEditorPayload>(`/boards/${boardId}`);
  return res.data;
};

export const toggleGenerateLink = async (boardId: string) => {
  if (!boardId) {
    throw new Error('boardId must be provided');
  }

  const res = await api.patch<{ message: string; generatedLink: string }>(
    `/boards/${boardId}/generate-link`
  );
  return res.data;
};

export const fetchCanvasElements = async (boardId: string) => {
  if (!boardId) {
    throw new Error('boardId must be provided');
  }

  const res = await api.get<{ canvasElements: CanvasElement[] }>(`/canvas-elements/${boardId}`);
  return res.data.canvasElements;
};

export const upsertCanvasElement = async (element: CanvasElementUpsert) => {
  const res = await api.post<{ canvasElement: CanvasElement }>('/canvas-elements', element);
  return res.data.canvasElement;
};

export const deleteCanvasElement = async (id: number) => {
  await api.delete(`/canvas-elements/${id}`);
};

export const triggerProduce = async (boardId: string) => {
  if (!boardId) {
    throw new Error('boardId must be provided');
  }

  const res = await api.post<TriggerProduceResponse>(`/boards/${boardId}/produce`);
  return res.data;
};

export const fetchProduceStatus = async (boardId: string, jobId: string) => {
  if (!boardId || !jobId) {
    throw new Error('boardId and jobId must be provided');
  }

  const res = await api.get<ProduceStatusResponse>(
    `/boards/${boardId}/produce/jobs/${jobId}`
  );
  return res.data;
};
