import React, { useEffect, useState } from 'react';

import { AssetType } from '@inf-monkeys/vines';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { publishAssetItem } from '@/apis/ugc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface IUgcPublishDialogProps {
  ugcId?: string;
  item: {
    assetType?: AssetType;
    name?: string;
    description?: string;
    iconUrl?: string;
    prevName?: string;
  };
  children?: React.ReactNode;
}

export const UgcPublishDialog: React.FC<IUgcPublishDialogProps> = ({ children, ugcId, item }) => {
  const { t } = useTranslation();

  const { name: rawName, description, assetType, iconUrl, prevName } = item;

  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(rawName ?? '');

  useEffect(() => {
    visible && rawName && setName(rawName);
  }, [visible]);

  const handlePublish = async () => {
    if (!ugcId || !assetType) {
      toast.error(t('common.load.empty'));
      return;
    }
    setIsLoading(true);
    toast.promise(
      publishAssetItem(
        assetType,
        ugcId,
        assetType === 'knowledge-base-table'
          ? {
              name: prevName,
              displayName: name,
              description,
              iconUrl,
              publicAssetCategoryIds: [],
            }
          : {
              name,
              description,
              iconUrl,
              publicAssetCategoryIds: [],
            },
      ),
      {
        success: () => {
          setVisible(false);
          return t('common.operate.success');
        },
        error: t('common.operate.error'),
        loading: t('common.operate.loading'),
      },
    );
    setIsLoading(false);
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('components.layout.ugc.publish-dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="gap-4 py-4">
          <Input
            placeholder={t('components.layout.ugc.publish-dialog.name.placeholder')}
            maxLength={50}
            value={name}
            onChange={setName}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button loading={isLoading} variant="solid" onClick={handlePublish}>
            {t('common.utils.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
