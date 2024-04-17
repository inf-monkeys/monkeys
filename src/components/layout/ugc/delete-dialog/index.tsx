import React from 'react';

import { AssetType } from '@inf-monkeys/vines';
import { toast } from 'sonner';

import { updateAssetItem } from '@/apis/ugc';
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

interface IUgcDeleteDialogProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  ugcId?: string;
  assetType?: AssetType;
  afterOperate?: () => void;
}

export const UgcDeleteDialog: React.FC<IUgcDeleteDialogProps> = ({
  visible,
  setVisible,
  ugcId,
  assetType,
  afterOperate,
}) => {
  const handleDelete = async () => {
    if (!ugcId || !assetType) {
      toast.error('请刷新页面后重试');
      return;
    }
    toast.promise(
      updateAssetItem(assetType, ugcId, {
        isDeleted: true,
      }),
      {
        success: () => {
          setVisible(false);
          afterOperate?.();
          return '删除成功';
        },
        error: '删除失败，请检查网络后重试',
        loading: '删除中......',
      },
    );
  };

  return (
    <AlertDialog open={visible} onOpenChange={setVisible}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除前确认</AlertDialogTitle>
          <AlertDialogDescription>该操作不可恢复，是否继续？</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleDelete()}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
