import React from 'react';

import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IPublishToMarketProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

export const PublishToMarket: React.FC<IPublishToMarketProps> = ({ visible, setVisible }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('components.layout.ugc.publish-dialog.title')}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setVisible(false)}>{t('common.utils.cancel')}</Button>
          <Button variant="solid">发布</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
