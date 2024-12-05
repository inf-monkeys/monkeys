import React from 'react';

import { Blocks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ShareView } from '@/components/layout-wrapper/workspace/space/sidebar/footer/share';
import { Button } from '@/components/ui/button';
import { usePageStore } from '@/store/usePageStore';

interface IFooterProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Footer: React.FC<IFooterProps> = () => {
  const { t } = useTranslation();
  const toggleApiDocumentVisible = usePageStore((s) => s.toggleApiDocumentVisible);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        icon={<Blocks />}
        size="small"
        className="h-auto flex-1 justify-start py-2 text-sm [&_svg]:stroke-gold-12"
        onClick={toggleApiDocumentVisible}
      >
        {t('workspace.wrapper.integration-center.title')}
      </Button>
      <ShareView />
    </div>
  );
};
