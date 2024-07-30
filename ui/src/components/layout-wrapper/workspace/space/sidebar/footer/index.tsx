import React from 'react';

import { Blocks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { ShareView } from '@/components/layout-wrapper/workspace/space/sidebar/footer/share';
import { Button } from '@/components/ui/button';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { usePageStore } from '@/store/usePageStore';

interface IFooterProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Footer: React.FC<IFooterProps> = () => {
  const { t } = useTranslation();
  const toggleApiDocumentVisible = usePageStore((s) => s.toggleApiDocumentVisible);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        icon={<Blocks />}
        size="small"
        className="h-auto justify-start py-2 text-sm [&_svg]:stroke-gold-12"
        onClick={toggleApiDocumentVisible}
      >
        {t('workspace.wrapper.integration-center.title')}
      </Button>
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
