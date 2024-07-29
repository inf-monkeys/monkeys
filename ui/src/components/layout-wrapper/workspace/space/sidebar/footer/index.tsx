import React from 'react';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { IntegrationCenter } from '@/components/layout-wrapper/workspace/space/sidebar/footer/integration-center';
import { ShareView } from '@/components/layout-wrapper/workspace/space/sidebar/footer/share';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { Separator } from '@/components/ui/separator.tsx';

interface IFooterProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Footer: React.FC<IFooterProps> = () => {
  return (
    <div className="flex flex-col gap-2">
      <IntegrationCenter />
      <Separator />
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <VinesDarkMode />
          <I18nSelector />
        </div>
        <ShareView />
      </div>
    </div>
  );
};
