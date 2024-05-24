import React from 'react';

import { KeySquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AccountTypes } from '@/components/layout/ugc-pages/action-tools/external-account/list.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface IVinesExternalAccountProps {}

export const VinesExternalAccount: React.FC<IVinesExternalAccountProps> = () => {
  const { t } = useTranslation();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button icon={<KeySquare />} variant="outline" size="small">
          {t('ugc-page.action-tools.ugc-view.subtitle.external-account.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle>{t('ugc-page.action-tools.ugc-view.subtitle.external-account.title')}</DialogTitle>
        <AccountTypes />
      </DialogContent>
    </Dialog>
  );
};
