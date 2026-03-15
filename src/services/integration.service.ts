import api from '../lib/api';
import type { CheckPatResponse } from '../types/pat.types';
import type { BoardEditorPayload } from '../types/board.types';
import type { CanvasElement, CanvasElementUpsert } from '../types/canvas.types';
import type { ProduceStatusResponse, TriggerProduceResponse } from '../hooks/produce.types';

export type PaperSize = 'A4' | 'Long' | 'Short' | 'Custom';

export interface CanvasConfigPayload {
  id?: number;
  boardId: string;
  paperSize: PaperSize;
  rows: number;
  columns: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  customWidthMm?: number | null;
  customHeightMm?: number | null;
}

export interface SignedUploadUrlResponse {
  signedUrl: string;
  storagePath: string;
  publicUrl: string;
  fileType: string;
  uploadEndpoint: string;
}

export interface ConfirmAssetUploadRequest {
  storagePath: string;
  publicUrl: string;
  fileType: string;
  fileSize: number;
}

export interface DataSource {
  name: string | null;
  records: Record<string, unknown>[];
}

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

export const upsertCanvasConfig = async (payload: CanvasConfigPayload) => {
  const res = await api.post<{ config: BoardEditorPayload['board']['config'] }>(
    '/canvas-config',
    payload
  );
  return res.data.config;
};

export const updateBoardOrientation = async (
  boardId: string,
  orientation: 'PORTRAIT' | 'LANDSCAPE'
) => {
  await api.patch(`/boards/${boardId}/orientation`, { orientation });
};

export const requestAssetSignedUrl = async (
  boardId: string,
  payload: { mimeType: string; fileSize: number }
): Promise<SignedUploadUrlResponse> => {
  const { data } = await api.post<SignedUploadUrlResponse>(
    `/boards/${boardId}/asset/signed-url`,
    payload
  );
  return data;
};

export const uploadAssetFile = async (signedUrl: string, uploadEndpoint: string, file: File) => {
  const absoluteUrl = signedUrl.startsWith('http')
    ? signedUrl
    : `${uploadEndpoint}${signedUrl}`;
  const response = await fetch(absoluteUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type, 'x-upsert': 'true' },
    body: file,
  });
  if (!response.ok) {
    throw new Error('Failed to upload asset to storage');
  }
};

export const confirmAssetUpload = async (boardId: string, payload: ConfirmAssetUploadRequest) => {
  const { data } = await api.post(`/boards/${boardId}/asset/confirm`, payload);
  return data;
};

export const fetchDataSource = async (boardId: string): Promise<DataSource> => {
  const res = await api.get<DataSource>(`/data-source/${boardId}`);
  return res.data;
};

export const uploadDataSourceFile = async (boardId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/data-source/${boardId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};
