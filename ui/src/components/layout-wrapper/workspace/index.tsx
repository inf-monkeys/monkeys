import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { WorkspaceHeader } from '@/components/layout-wrapper/workspace/header';
import { Space } from '@/components/layout-wrapper/workspace/space';

export const WorkspaceWrapper: React.FC = () => {
  return (
    <main className="size-full bg-slate-3">
      <WorkspaceHeader />
      <Space>
        <Outlet />
      </Space>
    </main>
  );
};
