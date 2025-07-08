import React from 'react';

import { Outlet } from '@tanstack/react-router';

import { VinesSpace } from '../space';
import { SpaceHeader } from '../space/header';

interface IProps {
  layoutId: string;
}

export const VercelAiWrapper: React.FC<IProps> = ({ layoutId }) => {
  return (
    <main className="flex size-full flex-col gap-4 bg-slate-3 p-4">
      <SpaceHeader></SpaceHeader>
      <VinesSpace className="border border-input p-4">
        <Outlet />
      </VinesSpace>
    </main>
  );
};
