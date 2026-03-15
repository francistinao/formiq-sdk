import type { CanvasElementProperties, CanvasElementType } from '../stores/canvasStore';

export type CanvasElement = {
  id: number;
  canvasElementConfigId: number;
  variableName?: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  properties: Record<string, unknown> | null;
  boardId: string;
};

export type CanvasElementUpsert = {
  id?: number;
  clientId?: string;
  canvasElementConfigId?: number;
  variableName?: string;
  type: CanvasElementType;
  x: number;
  y: number;
  rotation?: number;
  width: number;
  height: number;
  zIndex: number;
  properties: CanvasElementProperties;
  boardId: string;
};
