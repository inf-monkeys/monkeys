import React from 'react';

import { AssetType } from '@inf-monkeys/vines';
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
  const handleImport = async () => {
    if (!ugcId || !assetType) {
      toast.error('请刷新页面后重试');
      return;
    }
    toast.promise(forkAssetItem(assetType, ugcId), {
      success: () => {
        setVisible(false);
        afterOperate?.();
        return '导入成功';
      },
      error: '导入失败，请检查网络后重试',
      loading: '导入中......',
    });
  };

  return (
    <AlertDialog open={visible} onOpenChange={setVisible}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>导入前确认</AlertDialogTitle>
          <AlertDialogDescription>
            正在导入 <span className="text-primary">{name || '该项目'}</span> 导入您的团队下，是否继续？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleImport()}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
