import React from 'react';

import { Footer } from '@/components/layout-wrapper/workspace/space/sidebar/footer';
import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/sidebar/tabs';

interface IWorkspaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkspaceSidebar: React.FC<IWorkspaceSidebarProps> = () => {
  return (
    <nav className="flex h-full w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      <SpaceTabs />
      <Footer />
    </nav>
  );
};
