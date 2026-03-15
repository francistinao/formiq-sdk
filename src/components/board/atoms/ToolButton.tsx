'use client';

import * as React from 'react';

interface ToolButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function ToolButton({ label, icon, onClick, disabled }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 12px',
        minHeight: 80,
        border: '1.5px solid #e5e7eb',
        borderRadius: 12,
        background: '#fafafa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 150ms, box-shadow 150ms',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#374151',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#4fb8b2';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(79,184,178,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      <span style={{ color: '#6b7280' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
