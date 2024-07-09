import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { ViewGuard } from '@/components/layout-wrapper/view-guard.tsx';
import { WorkspaceHeader } from '@/components/layout-wrapper/workspace/header';
import { Space } from '@/components/layout-wrapper/workspace/space';

export const WorkspaceWrapper: React.FC = () => {
  return (
    <ViewGuard className="bg-slate-3">
      <WorkspaceHeader />
      <Space>
        <Outlet />
      </Space>
    </ViewGuard>
  );
};
