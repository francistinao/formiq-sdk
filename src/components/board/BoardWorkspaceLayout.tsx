'use client';

import * as React from 'react';
import { BoardSidebar } from './BoardSidebar';
import { BoardPropertiesPanel } from './BoardPropertiesPanel';

type BoardWorkspaceLayoutProps = {
  boardId: string;
  canEdit?: boolean;
  children: React.ReactNode;
};

export function BoardWorkspaceLayout({ boardId, canEdit = true, children }: BoardWorkspaceLayoutProps) {
  return (
    <div className="formiq-board-workspace">
      <div className="formiq-board-workspace__sidebar">
        <BoardSidebar boardId={boardId} canEdit={canEdit} />
      </div>
      <div className="formiq-board-workspace__canvas">
        {children}
      </div>
      <div className="formiq-board-workspace__properties">
        <BoardPropertiesPanel boardId={boardId} canEdit={canEdit} />
      </div>
    </div>
  );
}
