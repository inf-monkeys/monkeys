import React from 'react';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { IntegrationCenter } from '@/components/layout-wrapper/workspace/space/sidebar/integration-center';
import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/sidebar/tabs';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Separator } from '@/components/ui/separator.tsx';

interface IWorkspaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkspaceSidebar: React.FC<IWorkspaceSidebarProps> = () => {
  return (
    <nav className="flex h-full w-56 flex-col justify-between gap-4 overflow-y-hidden p-5">
      <SpaceTabs />
      <div className="flex flex-col gap-2">
        <IntegrationCenter />
        <Separator />
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <VinesDarkMode />
            <I18nSelector />
          </div>
        </div>
      </div>
    </nav>
  );
};
