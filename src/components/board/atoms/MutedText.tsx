'use client';

import * as React from 'react';

interface MutedTextProps {
  children: React.ReactNode;
}

export function MutedText({ children }: MutedTextProps) {
  return (
    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.5 }}>
      {children}
    </p>
  );
}
