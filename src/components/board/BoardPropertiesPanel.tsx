'use client';

import * as React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Barcode,
  Bold,
  ImageIcon,
  Italic,
  Pipette,
  QrCode,
  Text,
  Trash2,
  Underline,
  Upload,
} from 'lucide-react';

import { useCanvasStore } from '../../stores/canvasStore';
import type { CanvasElementProperties, CanvasElementType } from '../../stores/canvasStore';
import { useCanvasElement } from '../../hooks/useCanvasElement';
import { FONT_FAMILIES } from '../../constants/fontFamilies';
import { SectionTitle } from './atoms/SectionTitle';
import { InputField } from './atoms/InputField';
import { SelectInput } from './atoms/SelectInput';

const TYPE_META: Record<CanvasElementType, { label: string; Icon: React.ElementType }> = {
  text: { label: 'Dynamic Text', Icon: Text },
  qr_code: { label: 'QR Code', Icon: QrCode },
  bar_code: { label: 'Barcode', Icon: Barcode },
  image: { label: 'Image', Icon: ImageIcon },
};

function PropertiesEmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: '100%',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlignLeft size={20} color="#9ca3af" />
      </div>
      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
        No element selected
      </p>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
        Click an element on the canvas to edit its properties.
      </p>
    </div>
  );
}

function IconButton({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        border: `1px solid ${active ? '#4fb8b2' : '#e5e7eb'}`,
        background: active ? 'rgba(79,184,178,0.1)' : '#fff',
        color: active ? '#4fb8b2' : '#374151',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  );
}

type BoardPropertiesPanelProps = {
  boardId: string;
  canEdit?: boolean;
};

export function BoardPropertiesPanel({ boardId, canEdit = true }: BoardPropertiesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedId = useCanvasStore((state) => state.selectedId);
  const elements = useCanvasStore((state) => state.elements);
  const dataSourceMeta = useCanvasStore((state) => state.dataSourceMeta);
  const colorEyedropped = useCanvasStore((state) => state.colorEyedropped);
  const colorEyedropperActive = useCanvasStore((state) => state.colorEyedropperActive);
  const setColorEyedropped = useCanvasStore((state) => state.setColorEyedropped);
  const setColorEyedropperActive = useCanvasStore((state) => state.setColorEyedropperActive);
  const updateElementProperties = useCanvasStore((state) => state.updateElementProperties);
  const updateDimensions = useCanvasStore((state) => state.updateDimensions);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const bringForward = useCanvasStore((state) => state.bringForward);
  const sendBackward = useCanvasStore((state) => state.sendBackward);
  const removeElement = useCanvasStore((state) => state.removeElement);

  const { deleteCanvasElement, upsertCanvasElement } = useCanvasElement(boardId, { canEdit });

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) ?? null,
    [elements, selectedId]
  );

  const columnHeaders = dataSourceMeta?.columnHeaders ?? [];
  const boardTextVariables = useMemo(() => {
    const byKey = new Map<string, { key: string; incremental: boolean }>();
    for (const element of elements) {
      if (element.type !== 'text') continue;
      const rawKey =
        typeof element.properties.bindingKey === 'string' && element.properties.bindingKey.trim()
          ? element.properties.bindingKey
          : typeof element.text === 'string' && element.text.trim()
            ? element.text.replace(/{{\s*/, '').replace(/\s*}}/, '').trim()
            : null;
      if (!rawKey) continue;
      const existing = byKey.get(rawKey);
      const incremental = Boolean(element.properties.isIncrementalVariable);
      if (!existing) { byKey.set(rawKey, { key: rawKey, incremental }); continue; }
      byKey.set(rawKey, { key: rawKey, incremental: existing.incremental || incremental });
    }
    return [...byKey.values()];
  }, [elements]);

  // Apply eyedropped color
  useEffect(() => {
    if (!selectedElement || !canEdit || !colorEyedropped) return;
    const latest =
      useCanvasStore.getState().elements.find((el) => el.id === selectedElement.id) ?? selectedElement;
    updateElementProperties(selectedElement.id, { color: colorEyedropped });
    upsertCanvasElement(
      {
        id: latest.dbId,
        clientId: latest.id,
        canvasElementConfigId: latest.configDbId,
        boardId,
        type: latest.type,
        x: latest.x,
        y: latest.y,
        rotation: latest.rotation,
        width: latest.width,
        height: latest.height,
        zIndex: latest.zIndex,
        properties: {
          ...latest.properties,
          color: colorEyedropped,
          text: latest.text,
          data: latest.data,
          src: latest.src ?? latest.properties.src,
        },
      },
      (dbId, configDbId) => updateElement(latest.id, { dbId, configDbId })
    );
    setColorEyedropped(null);
  }, [boardId, colorEyedropped, canEdit, selectedElement, upsertCanvasElement, updateElement, updateElementProperties, setColorEyedropped]);

  if (!selectedElement) {
    return (
      <div style={{ height: '100%', background: '#fff', padding: 16 }}>
        <PropertiesEmptyState />
      </div>
    );
  }

  const current = selectedElement;

  function syncToBackend(
    elementPatch: Partial<typeof current> = {},
    propsPatch: Partial<CanvasElementProperties> = {}
  ) {
    if (!canEdit) return;
    const latest =
      useCanvasStore.getState().elements.find((el) => el.id === current.id) ?? current;
    upsertCanvasElement(
      {
        id: latest.dbId,
        clientId: latest.id,
        canvasElementConfigId: latest.configDbId,
        boardId,
        type: latest.type,
        x: elementPatch?.x ?? latest.x,
        y: elementPatch?.y ?? latest.y,
        rotation: elementPatch?.rotation ?? latest.rotation,
        width: elementPatch?.width ?? latest.width,
        height: elementPatch?.height ?? latest.height,
        zIndex: elementPatch?.zIndex ?? latest.zIndex,
        properties: {
          ...latest.properties,
          ...propsPatch,
          text: elementPatch?.text ?? latest.text,
          data: elementPatch?.data ?? latest.data,
          src: elementPatch?.src ?? latest.src ?? latest.properties.src,
        },
      },
      (dbId, configDbId) => updateElement(latest.id, { dbId, configDbId })
    );
  }

  function handleDimensionChange(
    field: 'x' | 'y' | 'width' | 'height',
    value: string
  ) {
    if (!canEdit) return;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    updateDimensions(current.id, { [field]: parsed });
    syncToBackend({ [field]: parsed });
  }

  const props = current.properties;
  const pickerColor = /^#(?:[0-9A-Fa-f]{3}){1,2}$/.test(props.color) ? props.color : '#000000';
  const previewValue = props.bindingKey ? (dataSourceMeta?.previewRow[props.bindingKey] ?? '') : '';
  const bindingOptions = [
    ...columnHeaders.map((h) => ({ label: h, value: h })),
    ...boardTextVariables
      .filter((item) => !columnHeaders.includes(item.key))
      .map((item) => ({
        label: item.incremental ? `${item.key} (incremental)` : item.key,
        value: item.key,
      })),
  ];

  const { label: typeLabel, Icon: TypeIcon } = TYPE_META[current.type];
  const headerSubtitle = (() => {
    switch (current.type) {
      case 'text': return current.text ?? '—';
      case 'qr_code':
      case 'bar_code': return props.bindingKey ? `Bound to: ${props.bindingKey}` : 'No variable bound';
      case 'image': return props.src ? 'Image uploaded' : 'No image';
    }
  })();

  const labelStyle: React.CSSProperties = {
    fontSize: '0.6rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.45em',
    fontWeight: 600,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: '16px 14px',
        overflowY: 'auto',
        height: '100%',
        background: '#fff',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={rowStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              background: '#f3f4f6',
              borderRadius: 12,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <TypeIcon size={18} color="#4fb8b2" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
              {typeLabel}
            </p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>{headerSubtitle}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={!canEdit || !current.dbId}
          title="Delete element"
          onClick={() => {
            if (!canEdit || !current.dbId) return;
            deleteCanvasElement(current.dbId, {
              onSuccess: () => removeElement(current.id),
            });
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: (!canEdit || !current.dbId) ? 'not-allowed' : 'pointer',
            opacity: (!canEdit || !current.dbId) ? 0.4 : 1,
            padding: 4,
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {!canEdit && (
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            color: '#6b7280',
            border: '1px dashed #e5e7eb',
            borderRadius: 8,
            padding: '8px 12px',
          }}
        >
          You have viewer access. Editing controls are disabled.
        </p>
      )}

      {/* ── Text-only properties ── */}
      {current.type === 'text' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={labelStyle}>Variable Name</span>
            <input
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.875rem',
                fontWeight: 600,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
              value={current.text ?? ''}
              disabled={!canEdit}
              onChange={(e) => {
                if (!canEdit) return;
                updateElement(current.id, { text: e.target.value });
                syncToBackend({ text: e.target.value });
              }}
            />
          </div>

          {/* Data binding */}
          <div>
            <SectionTitle style={{ marginBottom: 8 }}>Connect data</SectionTitle>
            <SelectInput
              value={props.bindingKey ?? ''}
              placeholder="Choose a column"
              options={bindingOptions}
              disabled={!canEdit}
              onValueChange={(value) => {
                if (!canEdit) return;
                updateElementProperties(current.id, { bindingKey: value });
                updateElement(current.id, { text: `{{${value}}}` });
                syncToBackend({ text: `{{${value}}}` }, { bindingKey: value });
              }}
            />
            {previewValue && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                Preview: &ldquo;{previewValue}&rdquo;
              </p>
            )}
          </div>

          {/* Typography */}
          <div>
            <SectionTitle style={{ marginBottom: 8 }}>Typography</SectionTitle>
            <SelectInput
              label="Font family"
              value={props.fontFamily}
              disabled={!canEdit}
              options={FONT_FAMILIES}
              onValueChange={(value) => {
                if (!canEdit) return;
                updateElementProperties(current.id, { fontFamily: value });
                syncToBackend({}, { fontFamily: value });
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <SelectInput
                label="Weight"
                value={props.fontWeight}
                disabled={!canEdit}
                options={[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Bold', value: 'bold' },
                ]}
                onValueChange={(value) => {
                  if (!canEdit) return;
                  const fontWeight = value as CanvasElementProperties['fontWeight'];
                  updateElementProperties(current.id, { fontWeight });
                  syncToBackend({}, { fontWeight });
                }}
              />
              <InputField
                label="Size"
                type="number"
                min={8}
                max={72}
                value={props.fontSize}
                disabled={!canEdit}
                onChange={(e) => {
                  if (!canEdit) return;
                  const fontSize = Number(e.target.value);
                  updateElementProperties(current.id, { fontSize });
                  syncToBackend({}, { fontSize });
                }}
              />
            </div>

            {/* Alignment & style toggles */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['left', 'center', 'right'] as const).map((align) => (
                  <IconButton
                    key={align}
                    active={props.textAlign === align}
                    disabled={!canEdit}
                    title={`Align ${align}`}
                    onClick={() => {
                      if (!canEdit) return;
                      updateElementProperties(current.id, { textAlign: align });
                      syncToBackend({}, { textAlign: align });
                    }}
                  >
                    {align === 'left' && <AlignLeft size={12} />}
                    {align === 'center' && <AlignCenter size={12} />}
                    {align === 'right' && <AlignRight size={12} />}
                  </IconButton>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <IconButton
                  active={props.fontWeight === 'bold'}
                  disabled={!canEdit}
                  title="Bold"
                  onClick={() => {
                    if (!canEdit) return;
                    const fontWeight: CanvasElementProperties['fontWeight'] =
                      props.fontWeight === 'bold' ? 'normal' : 'bold';
                    updateElementProperties(current.id, { fontWeight });
                    syncToBackend({}, { fontWeight });
                  }}
                >
                  <Bold size={12} />
                </IconButton>
                <IconButton
                  active={Boolean(props.italic)}
                  disabled={!canEdit}
                  title="Italic"
                  onClick={() => {
                    if (!canEdit) return;
                    const italic = !props.italic;
                    updateElementProperties(current.id, { italic });
                    syncToBackend({}, { italic });
                  }}
                >
                  <Italic size={12} />
                </IconButton>
                <IconButton
                  active={Boolean(props.underline)}
                  disabled={!canEdit}
                  title="Underline"
                  onClick={() => {
                    if (!canEdit) return;
                    const underline = !props.underline;
                    updateElementProperties(current.id, { underline });
                    syncToBackend({}, { underline });
                  }}
                >
                  <Underline size={12} />
                </IconButton>
              </div>
            </div>

            {/* Color */}
            <div style={{ ...rowStyle, marginTop: 12 }}>
              <span style={labelStyle}>Color</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconButton
                  active={colorEyedropperActive}
                  disabled={!canEdit}
                  title="Eyedropper"
                  onClick={() => {
                    setColorEyedropped(null);
                    setColorEyedropperActive(!colorEyedropperActive);
                  }}
                >
                  <Pipette size={12} />
                </IconButton>
                <span
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: '#374151',
                  }}
                >
                  {pickerColor}
                </span>
                <input
                  type="color"
                  value={pickerColor}
                  disabled={!canEdit}
                  onChange={(e) => {
                    if (!canEdit) return;
                    updateElementProperties(current.id, { color: e.target.value });
                    syncToBackend({}, { color: e.target.value });
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    border: '1px solid #e5e7eb',
                    borderRadius: '50%',
                    cursor: !canEdit ? 'not-allowed' : 'pointer',
                    overflow: 'hidden',
                  }}
                  title="Pick color"
                />
              </div>
            </div>
            {canEdit && colorEyedropperActive && (
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                Click any pixel on the canvas to sample its color.
              </p>
            )}
          </div>
        </>
      )}

      {/* ── QR / Barcode properties ── */}
      {(current.type === 'qr_code' || current.type === 'bar_code') && (
        <div>
          <SectionTitle style={{ marginBottom: 4 }}>Connect data</SectionTitle>
          <p style={{ margin: '0 0 8px', fontSize: '0.75rem', color: '#9ca3af' }}>
            Select a column whose value will be encoded into the{' '}
            {current.type === 'qr_code' ? 'QR code' : 'barcode'}.
          </p>
          <SelectInput
            value={props.bindingKey ?? ''}
            placeholder="Choose a column"
            options={bindingOptions}
            disabled={!canEdit}
            onValueChange={(value) => {
              if (!canEdit) return;
              updateElementProperties(current.id, { bindingKey: value });
              updateElement(current.id, { data: `{{${value}}}` });
              syncToBackend({ data: `{{${value}}}` }, { bindingKey: value, data: `{{${value}}}`, text: `{{${value}}}` });
            }}
          />
          {previewValue && (
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
              Preview: &ldquo;{previewValue}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* ── Image properties ── */}
      {current.type === 'image' && (
        <>
          <SectionTitle style={{ marginBottom: 4 }}>Image Source</SectionTitle>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={!canEdit}
            onChange={(e) => {
              if (!canEdit) return;
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const src = ev.target?.result as string;
                updateElement(current.id, { src });
                updateElementProperties(current.id, { src });
                syncToBackend({}, { src });
              };
              reader.readAsDataURL(file);
            }}
          />
          {props.src && (
            <img
              src={props.src}
              alt="Element preview"
              style={{
                width: '100%',
                maxHeight: 96,
                objectFit: 'contain',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
              }}
            />
          )}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => { if (!canEdit) return; fileInputRef.current?.click(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: !canEdit ? 'not-allowed' : 'pointer',
              opacity: !canEdit ? 0.5 : 1,
              color: '#374151',
              boxSizing: 'border-box',
            }}
          >
            <Upload size={16} />
            {props.src ? 'Replace Image' : 'Upload Image'}
          </button>
        </>
      )}

      {/* ── Shared: Position & Size ── */}
      <div>
        <SectionTitle style={{ marginBottom: 8 }}>Position &amp; Size</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <InputField label="X" type="number" value={Math.round(current.x)} disabled={!canEdit}
            onChange={(e) => handleDimensionChange('x', e.target.value)} />
          <InputField label="Y" type="number" value={Math.round(current.y)} disabled={!canEdit}
            onChange={(e) => handleDimensionChange('y', e.target.value)} />
          <InputField label="Width" type="number" value={Math.round(current.width)} disabled={!canEdit}
            onChange={(e) => handleDimensionChange('width', e.target.value)} />
          <InputField label="Height" type="number" value={Math.round(current.height)} disabled={!canEdit}
            onChange={(e) => handleDimensionChange('height', e.target.value)} />
        </div>
      </div>

      {/* ── Shared: Arrangement ── */}
      <div>
        <SectionTitle style={{ marginBottom: 8 }}>Arrangement</SectionTitle>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Forward', icon: <ArrowUp size={14} />, action: () => bringForward(current.id) },
            { label: 'Backward', icon: <ArrowDown size={14} />, action: () => sendBackward(current.id) },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              type="button"
              disabled={!canEdit}
              onClick={() => { if (!canEdit) return; action(); }}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                background: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: !canEdit ? 'not-allowed' : 'pointer',
                opacity: !canEdit ? 0.5 : 1,
                color: '#374151',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Shared: Opacity ── */}
      <div>
        <div style={{ ...rowStyle, marginBottom: 6 }}>
          <SectionTitle>Opacity</SectionTitle>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
            {Math.round(props.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={props.opacity * 100}
          disabled={!canEdit}
          onChange={(e) => {
            if (!canEdit) return;
            const opacity = Number(e.target.value) / 100;
            updateElementProperties(current.id, { opacity });
            syncToBackend({}, { opacity });
          }}
          style={{
            width: '100%',
            cursor: !canEdit ? 'not-allowed' : 'pointer',
            accentColor: '#4fb8b2',
            opacity: !canEdit ? 0.5 : 1,
          }}
        />
      </div>
    </div>
  );
}
