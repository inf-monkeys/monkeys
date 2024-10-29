import React from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { publishApplication } from '@/apis/application-store';
import { IPublishToMarketWithAssetsContext } from '@/components/layout/ugc-pages/workflows/publish-to-market/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IPublishToMarketProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  context?: IPublishToMarketWithAssetsContext;
}

export const PublishToMarket: React.FC<IPublishToMarketProps> = ({ visible, setVisible, context }) => {
  const { t } = useTranslation();
  const publishToMarket = () => {
    if (!context?.id) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    toast.promise(publishApplication(context.id, 'workflow', {}), {
      loading: t('common.operate.loading'),
      success: () => {
        setVisible(false);
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
    });
  };
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('components.layout.ugc.publish-dialog.title')}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setVisible(false)}>{t('common.utils.cancel')}</Button>
          <Button onClick={() => publishToMarket()} variant="solid">
            {t('components.layout.ugc.publish-dialog.button.publish')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
