import type { CanvasElementType } from '../stores/canvasStore';

export interface BoardEditorCanvasElement {
  id: number;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  properties: Record<string, unknown> | null;
  data?: string | null;
  text?: string | null;
  src?: string | null;
}

export interface BoardEditorDataSource {
  columnHeaders: string[];
  parsedData: Record<string, string>[];
}

export interface BoardEditorAsset {
  fileUrl: string;
}

export interface BoardEditorConfig {
  id: number;
  paperSize: string;
  customWidthMm: number | null;
  customHeightMm: number | null;
  rows: number;
  columns: number;
  marginTopMm: number;
  marginRightMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
}

export interface BoardEditorCollaborator {
  id: number;
  collaborationId: number;
  userId: number | null;
  invitedEmail: string;
  invitedByUserId: number;
  role: 'owner' | 'editor' | 'viewer';
  invitationStatus: 'ACCEPTED' | 'PENDING' | 'DECLINED';
  token: string;
  expiresAt: string;
  joinedAt: string | null;
  createdAt: string;
}

export interface BoardEditorCollaboration {
  id: number;
  boardId: string;
  createdAt: string;
  collaborators: BoardEditorCollaborator[];
}

export interface BoardEditorPayload {
  board: {
    id: string;
    userId: number;
    boardName: string;
    orientation: 'PORTRAIT' | 'LANDSCAPE';
    presetType: string | null;
    asset: BoardEditorAsset | null;
    dataSource: BoardEditorDataSource | null;
    config: BoardEditorConfig | null;
    collaboration: BoardEditorCollaboration | null;
    generatedLink: string | null;
  };
}

export type BoardAccessRole = 'owner' | 'editor' | 'viewer' | null;
