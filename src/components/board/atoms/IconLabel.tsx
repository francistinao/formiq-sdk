'use client';

import * as React from 'react';

interface IconLabelProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
}

export function IconLabel({ icon, label, description }: IconLabelProps) {
  const truncated = label.length > 24 ? '…' + label.slice(Math.floor(label.length / 2)) : label;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: '#6b7280', flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
          {truncated}
        </p>
        {description && (
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>{description}</p>
        )}
      </div>
    </div>
  );
}
