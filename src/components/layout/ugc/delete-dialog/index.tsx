import React, { useState } from 'react';

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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';

interface IUgcDeleteDialogProps {
  ugcId?: string;
  assetType?: AssetType;
  afterOperate?: () => void;
  children?: React.ReactNode;
}

export const UgcDeleteDialog: React.FC<IUgcDeleteDialogProps> = ({ children, ugcId, assetType, afterOperate }) => {
  const [visible, setVisible] = useState(false);

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
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
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
