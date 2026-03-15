'use client';

import * as React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function SectionTitle({ children, style }: SectionTitleProps) {
  return (
    <h3
      style={{
        margin: 0,
        fontSize: '1rem',
        fontWeight: 600,
        color: '#111827',
        ...style,
      }}
    >
      {children}
    </h3>
  );
}
