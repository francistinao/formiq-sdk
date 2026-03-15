'use client';

import * as React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export function InputField({ label, helperText, className, style, ...props }: InputFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span
          style={{
            fontSize: '0.65rem',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.35em',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      )}
      <input
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: '0.875rem',
          fontWeight: 600,
          width: '100%',
          boxSizing: 'border-box',
          outline: 'none',
          background: '#fff',
          ...style,
        }}
        {...props}
      />
      {helperText && (
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{helperText}</span>
      )}
    </div>
  );
}
