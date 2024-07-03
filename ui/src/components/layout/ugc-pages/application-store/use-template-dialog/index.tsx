import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { forkApplicationFromTemplate } from '@/apis/application-store';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesIcon } from '@/components/ui/vines-icon';
import { I18nContent } from '@/utils';

interface IUgcApplicationStoreUseTemplateDialogProps {
  children?: React.ReactNode;
  item: IAssetItem<IApplicationStoreItemDetail>;
}

export const UgcApplicationStoreUseTemplateDialog: React.FC<IUgcApplicationStoreUseTemplateDialogProps> = ({
  children,
  item,
}) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const teamId = localStorage.getItem('vines-team-id');

  const handleUse = async () => {
    if (!item.id) return;

    setIsLoading(true);

    toast.promise(
      forkApplicationFromTemplate(item.id).then((flow) => {
        if (!flow) return;
        open(`/${teamId}/workspace/${flow.workflowId}`, '_blank');
      }),
      {
        success: () => {
          setVisible(false);
          return t('components.layout.ugc.import-dialog.use-template.success');
        },
        error: t('components.layout.ugc.import-dialog.use-template.error'),
        loading: t('components.layout.ugc.import-dialog.use-template.loading'),
        finally: () => {
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('components.layout.ugc.import-dialog.use-template.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <VinesIcon src={item.iconUrl} size="xl" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold">{I18nContent(item.displayName)}</span>
            <span className="text-sm">{I18nContent(item.description)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button loading={isLoading} variant="solid" onClick={handleUse}>
            {t('common.utils.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
