'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { TextCursorInput, QrCode, Barcode, Image as ImageIcon, FileText, RectangleVertical, RectangleHorizontal } from 'lucide-react';

import { useCanvasStore } from '../../stores/canvasStore';
import type { CanvasElementType } from '../../stores/canvasStore';
import { useBoardEditor } from '../../hooks/useBoardEditor';
import {
  upsertCanvasConfig,
  updateBoardOrientation,
  requestAssetSignedUrl,
  uploadAssetFile,
  confirmAssetUpload,
  fetchDataSource,
  uploadDataSourceFile,
  type CanvasConfigPayload,
  type PaperSize,
} from '../../services/integration.service';
import type { BoardEditorPayload } from '../../types/board.types';

import { SectionChip } from './atoms/SectionChip';
import { SectionTitle } from './atoms/SectionTitle';
import { InputField } from './atoms/InputField';
import { SelectInput } from './atoms/SelectInput';
import { SliderControl } from './atoms/SliderControl';
import { ToolButton } from './atoms/ToolButton';
import { MutedText } from './atoms/MutedText';
import { IconLabel } from './atoms/IconLabel';
import { FileUploadInput } from './atoms/FileUploadInput';

const TOOL_OPTIONS: Array<{ label: string; icon: React.ReactNode; type: CanvasElementType }> = [
  { label: 'Text', icon: <TextCursorInput size={20} />, type: 'text' },
  { label: 'QR Code', icon: <QrCode size={20} />, type: 'qr_code' },
  { label: 'Barcode', icon: <Barcode size={20} />, type: 'bar_code' },
  { label: 'Image', icon: <ImageIcon size={20} />, type: 'image' },
];

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

type BoardSidebarProps = {
  boardId: string;
  canEdit?: boolean;
};

export function BoardSidebar({ boardId, canEdit = true }: BoardSidebarProps) {
  const queryClient = useQueryClient();
  const boardQuery = useBoardEditor(boardId);
  const addElement = useCanvasStore((state) => state.addElement);
  const setDataSourceMeta = useCanvasStore((state) => state.setDataSourceMeta);
  const assetUrl = useCanvasStore((state) => state.assetUrl);
  const setAssetUrl = useCanvasStore((state) => state.setAssetUrl);

  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [rows, setRows] = useState(4);
  const [columns, setColumns] = useState(2);
  const [margin, setMargin] = useState(12);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataSourceInfo, setDataSourceInfo] = useState<{ name: string; records: number } | null>(null);
  const hasHydratedFromConfig = useRef(false);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);

  // Fetch persisted data source
  const dataSourceQuery = useQuery({
    queryKey: ['data-source', boardId],
    queryFn: () => fetchDataSource(boardId),
    enabled: Boolean(boardId),
    retry: false,
  });

  const activeDataSource = dataSourceInfo
    ? dataSourceInfo
    : dataSourceQuery.data?.name
      ? { name: dataSourceQuery.data.name, records: dataSourceQuery.data.records?.length ?? 0 }
      : null;

  // Hydrate form state from persisted board config
  useEffect(() => {
    const board = boardQuery.data?.board;
    const config = board?.config;
    if (!config || hasHydratedFromConfig.current) return;
    setOrientation((board.orientation as 'PORTRAIT' | 'LANDSCAPE') ?? 'PORTRAIT');
    setPaperSize((config.paperSize as PaperSize) ?? 'A4');
    if (typeof config.rows === 'number' && config.rows > 0) setRows(clampInt(config.rows, 1, 50));
    setColumns(clampInt(config.columns ?? 1, 1, 20));
    setMargin(clampInt(Math.round(config.marginTopMm ?? 10), 0, 50));
    hasHydratedFromConfig.current = true;
  }, [boardQuery.data?.board]);

  // Debounced config persist
  const upsertConfigMutation = useMutation({
    mutationFn: upsertCanvasConfig,
    onSuccess: (config) => {
      queryClient.setQueryData(['board-editor', boardId], (old: BoardEditorPayload | undefined) => {
        if (!old) return old;
        return { ...old, board: { ...old.board, config } };
      });
    },
  });

  const debouncedPersistConfig = useMemo(
    () => debounce((payload: CanvasConfigPayload) => upsertConfigMutation.mutate(payload), 400),
    [upsertConfigMutation]
  );

  useEffect(() => () => debouncedPersistConfig.cancel(), [debouncedPersistConfig]);

  function persistLayoutConfig(next: Partial<{ paperSize: PaperSize; columns: number; margin: number; rows: number }>) {
    if (!canEdit) return;
    const configId = boardQuery.data?.board?.config?.id;
    if (!configId) return;
    debouncedPersistConfig({
      id: configId,
      boardId,
      paperSize: next.paperSize ?? paperSize,
      rows: typeof next.rows === 'number' ? clampInt(next.rows, 1, 50) : rows,
      columns: clampInt(next.columns ?? columns, 1, 20),
      marginTopMm: clampInt(next.margin ?? margin, 0, 50),
      marginRightMm: clampInt(next.margin ?? margin, 0, 50),
      marginBottomMm: clampInt(next.margin ?? margin, 0, 50),
      marginLeftMm: clampInt(next.margin ?? margin, 0, 50),
    });
  }

  const updateOrientationMutation = useMutation({
    mutationFn: (next: 'PORTRAIT' | 'LANDSCAPE') => updateBoardOrientation(boardId, next),
    onSuccess: (_data, next) => {
      queryClient.setQueryData(['board-editor', boardId], (old: BoardEditorPayload | undefined) => {
        if (!old) return old;
        return { ...old, board: { ...old.board, orientation: next } };
      });
    },
  });

  async function handleReplaceImage(file: File) {
    if (!canEdit || isReplacingImage) return;
    setIsReplacingImage(true);
    try {
      const signed = await requestAssetSignedUrl(boardId, { mimeType: file.type, fileSize: file.size });
      await uploadAssetFile(signed.signedUrl, signed.uploadEndpoint, file);
      await confirmAssetUpload(boardId, {
        storagePath: signed.storagePath,
        publicUrl: signed.publicUrl,
        fileType: signed.fileType,
        fileSize: file.size,
      });
      setAssetUrl(signed.publicUrl);
    } catch {
      // silently fail – consumers can wrap in their own error handling
    } finally {
      setIsReplacingImage(false);
      if (replaceImageInputRef.current) replaceImageInputRef.current.value = '';
    }
  }

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => uploadDataSourceFile(boardId, file),
    onSuccess: (data) => {
      const headers = (data?.dataSource?.columnHeaders ?? []) as string[];
      const previewRow = (data?.dataSource?.parsedData?.[0] as Record<string, string>) ?? {};
      setDataSourceMeta({ columnHeaders: headers, previewRow });
      queryClient.invalidateQueries({ queryKey: ['data-source', boardId] });
    },
  });

  function handleFile(file: File | null) {
    if (!canEdit) return;
    setSelectedFile(file);
    if (!file) { setDataSourceInfo(null); setDataSourceMeta(null); return; }

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const headers = (lines[0] ?? '').split(',').map((h) => h.trim()).filter(Boolean);
        const previewValues = (lines[1] ?? '').split(',').map((v) => v.trim());
        const previewRow: Record<string, string> = {};
        headers.forEach((h, i) => { previewRow[h] = previewValues[i] ?? ''; });
        setDataSourceInfo({ name: file.name, records: Math.max(lines.length - 1, 0) });
        setDataSourceMeta({ columnHeaders: headers, previewRow });
      };
      reader.readAsText(file);
    } else {
      setDataSourceInfo({ name: file.name, records: 0 });
    }
  }

  function handleMapColumns() {
    if (!canEdit || !selectedFile) return;
    uploadFileMutation.mutate(selectedFile);
  }

  const ticketsPerPage = rows * columns;

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const borderedSection: React.CSSProperties = {
    ...sectionStyle,
    border: '1px dashed #e5e7eb',
    borderRadius: 16,
    padding: 16,
  };

  const btnBase: React.CSSProperties = {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 150ms',
    boxSizing: 'border-box',
  };

  return (
    <div
      className="formiq-board-sidebar"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 20px', overflowY: 'auto', height: '100%' }}
    >
      {/* Base Template */}
      <section style={borderedSection}>
        <SectionChip label="Base Template" color="#0ea5e9" />
        <div
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            border: '1px dashed #e5e7eb',
            padding: 8,
            background: '#f9fafb',
          }}
        >
          <div
            style={{
              height: 140,
              borderRadius: 14,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #0b234d, #291b61, #0b3d73)',
              position: 'relative',
            }}
          >
            {assetUrl && (
              <img
                src={assetUrl}
                alt="Base template"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
          </div>
        </div>
        <input
          ref={replaceImageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplaceImage(f); }}
        />
        <button
          type="button"
          disabled={!canEdit || isReplacingImage}
          onClick={() => replaceImageInputRef.current?.click()}
          style={{
            ...btnBase,
            background: '#4fb8b2',
            color: '#fff',
            border: 'none',
            opacity: (!canEdit || isReplacingImage) ? 0.6 : 1,
            cursor: (!canEdit || isReplacingImage) ? 'not-allowed' : 'pointer',
          }}
        >
          {isReplacingImage ? 'Replacing…' : 'Replace Image'}
        </button>
        {!canEdit && <MutedText>You have viewer access. Editing controls are disabled.</MutedText>}
      </section>

      {/* Data Source */}
      <section style={sectionStyle}>
        <SectionChip label="Data Source" color="#10b981" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            border: '1px solid #d1fae5',
            borderRadius: 16,
            padding: 16,
            background: '#f0fdf4',
          }}
        >
          {activeDataSource ? (
            <>
              <IconLabel
                icon={<FileText size={20} color="#10b981" />}
                label={activeDataSource.name}
                description={`${activeDataSource.records.toLocaleString()} records found`}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  disabled={!canEdit || uploadFileMutation.isPending}
                  onClick={handleMapColumns}
                  style={{
                    ...btnBase,
                    flex: 1,
                    background: '#fff',
                    border: '1px solid #d1d5db',
                    color: '#374151',
                    opacity: (!canEdit || uploadFileMutation.isPending) ? 0.6 : 1,
                    cursor: (!canEdit || uploadFileMutation.isPending) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploadFileMutation.isPending ? 'Mapping...' : 'Map Columns'}
                </button>
              </div>
            </>
          ) : (
            <FileUploadInput
              label="Upload CSV / XLSX"
              helperText="Records will be counted automatically"
              onFileChange={handleFile}
              disabled={!canEdit}
            />
          )}
        </div>
      </section>

      {/* Paper Settings */}
      <section style={sectionStyle}>
        <SectionChip label="Paper Settings" color="#8b5cf6" />
        <SectionTitle>Layout controls</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Orientation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>Orientation</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(
                [
                  { value: 'PORTRAIT', label: 'Portrait', Icon: RectangleVertical },
                  { value: 'LANDSCAPE', label: 'Landscape', Icon: RectangleHorizontal },
                ] as const
              ).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    if (!canEdit || orientation === value) return;
                    setOrientation(value);
                    updateOrientationMutation.mutate(value);
                    persistLayoutConfig({ paperSize, columns, margin, rows });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    border: `1px solid ${orientation === value ? '#4fb8b2' : '#e5e7eb'}`,
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: orientation === value ? 'rgba(79,184,178,0.08)' : '#fff',
                    color: orientation === value ? '#4fb8b2' : '#6b7280',
                    cursor: !canEdit ? 'not-allowed' : 'pointer',
                    opacity: !canEdit ? 0.5 : 1,
                    transition: 'all 150ms',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <SelectInput
            label="Paper Size"
            value={paperSize}
            disabled={!canEdit}
            onValueChange={(v) => {
              if (!canEdit) return;
              const next = v as PaperSize;
              setPaperSize(next);
              persistLayoutConfig({ paperSize: next });
            }}
            options={[
              { label: 'A4 (210 × 297 mm)', value: 'A4' },
              { label: 'Long format', value: 'Long' },
              { label: 'Ticket (Short)', value: 'Short' },
              { label: 'Custom', value: 'Custom' },
            ]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InputField
              label="Rows/Page"
              type="number"
              value={rows}
              min={1}
              max={50}
              disabled={!canEdit}
              onChange={(e) => {
                if (!canEdit) return;
                const next = clampInt(Number(e.target.value), 1, 50);
                setRows(next);
                persistLayoutConfig({ rows: next });
              }}
            />
            <InputField
              label="Columns"
              type="number"
              value={columns}
              min={1}
              max={20}
              disabled={!canEdit}
              onChange={(e) => {
                if (!canEdit) return;
                const next = clampInt(Number(e.target.value), 1, 20);
                setColumns(next);
                persistLayoutConfig({ columns: next });
              }}
            />
          </div>
          <MutedText>
            {ticketsPerPage.toLocaleString()} asset{ticketsPerPage === 1 ? '' : 's'} per page
          </MutedText>
          <SliderControl
            label="Margins"
            value={margin}
            min={0}
            max={50}
            disabled={!canEdit}
            onChange={(v) => {
              if (!canEdit) return;
              const next = clampInt(v, 0, 50);
              setMargin(next);
              persistLayoutConfig({ margin: next });
            }}
            helperText="Margins in millimeters"
          />
        </div>
      </section>

      {/* Toolbox */}
      <section style={sectionStyle}>
        <SectionChip label="Toolbox" color="#f97316" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {TOOL_OPTIONS.map((tool) => (
            <ToolButton
              key={tool.label}
              label={tool.label}
              icon={tool.icon}
              disabled={!canEdit}
              onClick={() => {
                if (!canEdit) return;
                addElement(tool.type);
              }}
            />
          ))}
        </div>
        <MutedText>Drag elements onto the canvas once it is ready.</MutedText>
      </section>
    </div>
  );
}
