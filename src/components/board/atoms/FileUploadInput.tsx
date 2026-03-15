'use client';

import * as React from 'react';
import { useId, useState } from 'react';

interface FileUploadInputProps {
  label?: string;
  helperText?: string;
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUploadInput({
  label,
  helperText,
  onFileChange,
  disabled = false,
}: FileUploadInputProps) {
  const id = useId();
  const [hovered, setHovered] = useState(false);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileChange?.(file);
  }

  return (
    <label
      htmlFor={id}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        textAlign: 'center',
        padding: '14px 16px',
        border: `1.5px dashed ${hovered && !disabled ? '#4fb8b2' : '#d1d5db'}`,
        borderRadius: 12,
        background: '#fafafa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 150ms',
        boxSizing: 'border-box',
      }}
    >
      {label && (
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: '#6b7280',
          }}
        >
          {label}
        </span>
      )}
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
        Drop or browse CSV / XLSX
      </span>
      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
        {helperText ?? 'Supports .csv and .xlsx files'}
      </span>
      <input
        id={id}
        type="file"
        accept=".csv,.xlsx"
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
