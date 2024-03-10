import React from 'react';

import { ContextMenu } from '@/components/layout/vines-flow/headless-modal/context-menu';

interface IVinesHeadlessModalProps {}

export const VinesHeadlessModal: React.FC<IVinesHeadlessModalProps> = () => {
  return (
    <div className="pointer-events-none absolute size-full">
      <ContextMenu />
    </div>
  );
};
