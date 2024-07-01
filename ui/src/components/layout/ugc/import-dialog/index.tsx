import React from 'react';

import { AssetType } from '@inf-monkeys/monkeys';
import { toast } from 'sonner';

import { forkAssetItem } from '@/apis/ugc';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { useTranslation } from 'react-i18next';

interface IUgcImportDialogProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  ugcId?: string;
  assetType?: AssetType;
  name?: string;
  afterOperate?: () => void;
}

export const UgcImportDialog: React.FC<IUgcImportDialogProps> = ({
  visible,
  setVisible,
  ugcId,
  assetType,
  name,
  afterOperate,
}) => {
  const { t } = useTranslation();

  const handleImport = async () => {
    if (!ugcId || !assetType) {
      toast.error(t('common.load.empty'));
      return;
    }
    toast.promise(forkAssetItem(assetType, ugcId), {
      success: () => {
        setVisible(false);
        afterOperate?.();
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      loading: t('common.operate.loading'),
    });
  };

  return (
    <AlertDialog open={visible} onOpenChange={setVisible}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('components.layout.ugc.import-dialog.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('components.layout.ugc.import-dialog.content', {
              name: (
                <span className="text-primary">
                  {name || t('components.layout.ugc.import-dialog.utils.this-project')}
                </span>
              ),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleImport()}>{t('common.utils.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
