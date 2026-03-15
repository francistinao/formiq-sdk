'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { useBoardEditor } from '../../hooks/useBoardEditor';
import { useCanvasElement } from '../../hooks/useCanvasElement';
import { useProduce } from '../../hooks/useProduce';
import { BoardCanvas } from './BoardCanvas';
import { useCanvasStore } from '../../stores/canvasStore';
import { mapCanvasElement } from '../../utils/canvas/mapCanvasElement';
import { getPersonalAccessToken } from '../../services/personalAccessToken.service';

type BoardEditorProps = {
  boardId: string;
  canEdit?: boolean;
};

type DataSourceMeta = {
  columnHeaders?: string[];
  parsedData?: Record<string, string>[];
} | null;

function buildDataSourceMeta(dataSource: DataSourceMeta) {
  if (!dataSource) return null;

  const columnHeaders = Array.isArray(dataSource.columnHeaders) ? dataSource.columnHeaders : [];
  const previewRow =
    Array.isArray(dataSource.parsedData) && dataSource.parsedData.length
      ? dataSource.parsedData[0]
      : {};
  return { columnHeaders, previewRow };
}

export function BoardEditor({ boardId, canEdit = true }: BoardEditorProps) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const setElements = useCanvasStore((state) => state.setElements);
  const mergeElements = useCanvasStore((state) => state.mergeElements);
  const setDataSourceMeta = useCanvasStore((state) => state.setDataSourceMeta);
  const setAssetUrl = useCanvasStore((state) => state.setAssetUrl);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const existing = getPersonalAccessToken();
    setToken(existing);
    setReady(true);
  }, []);

  const boardQuery = useBoardEditor(boardId, { enabled: Boolean(ready && token) });
  const { canvasElements } = useCanvasElement(boardId, { enabled: Boolean(ready && token) });
  const produce = useProduce(boardId);

  const boardName = useMemo(() => {
    if (!boardQuery.data) {
      return 'Board';
    }
    return boardQuery.data.board.boardName;
  }, [boardQuery.data]);

  useEffect(() => {
    if (!boardQuery.data?.board) {
      setElements([]);
      setDataSourceMeta(null);
      setAssetUrl(null);
      return;
    }

    const { board } = boardQuery.data;
    setDataSourceMeta(buildDataSourceMeta(board.dataSource));
    setAssetUrl(board.asset?.fileUrl ?? null);
  }, [boardQuery.data, setElements, setDataSourceMeta, setAssetUrl]);

  useEffect(() => {
    if (!canvasElements) return;

    if (!initialLoadDone.current) {
      setElements(canvasElements.map(mapCanvasElement));
      initialLoadDone.current = true;
      return;
    }

    mergeElements(canvasElements.map(mapCanvasElement));
  }, [canvasElements, setElements, mergeElements]);

  async function handleGenerateClick() {
    if (produce.status === 'READY' && produce.downloadUrl) {
      window.open(produce.downloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    await produce.triggerGeneration();
  }

  return (
    <div className="formiq-board">
      <div className="formiq-board__header">
        <div className="formiq-board__title">{boardName}</div>
        <div className="formiq-board__actions">
          <button
            type="button"
            className="formiq-board__button"
            onClick={handleGenerateClick}
            disabled={produce.isTriggering || produce.isGenerating || !token}
          >
            {produce.isGenerating ? `Generating ${produce.progress}%` : 'Generate PDF'}
          </button>
          {produce.downloadUrl && produce.status === 'READY' && (
            <button
              type="button"
              className="formiq-board__button formiq-board__button--ghost"
              onClick={() => window.open(produce.downloadUrl, '_blank', 'noopener,noreferrer')}
            >
              Download PDF
            </button>
          )}
        </div>
      </div>
      {boardQuery.isError && (
        <div className="formiq-board__error">
          Failed to load board. Check your PAT and board id.
        </div>
      )}
      {!token && (
        <div className="formiq-board__empty">
          No PAT provided. Wrap this component with <code>{'<FormiqProvider token="...">'}</code>.
        </div>
      )}
      {token && (
        <div className="formiq-board__canvas">
          <BoardCanvas boardId={boardId} board={boardQuery.data?.board} canEdit={canEdit} />
        </div>
      )}
    </div>
  );
}
