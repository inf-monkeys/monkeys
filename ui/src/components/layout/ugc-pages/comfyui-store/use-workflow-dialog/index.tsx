import React, { useState } from 'react';

import { toast } from 'sonner';

import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { forkAssetItem } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesIcon } from '@/components/ui/vines-icon';

interface IUgcComfyUIWorkflowStoreUseWorkflowDialogProps {
  children?: React.ReactNode;
  item: IAssetItem<IComfyuiWorkflow>;
}

export const UgcComfyUIWorkflowStoreUseWorkflowDialog: React.FC<IUgcComfyUIWorkflowStoreUseWorkflowDialogProps> = ({
  children,
  item,
}) => {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const teamId = localStorage.getItem('vines-team-id');

  const handleUse = async () => {
    if (!item.id) return;

    setIsLoading(true);

    toast.promise(forkAssetItem('comfyui-workflow', item.id), {
      success: () => {
        setVisible(false);
        return '创建成功';
      },
      error: '创建失败，请检查网络后重试',
      loading: '创建中......',
      finally: () => {
        setIsLoading(false);
      },
    });
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>使用该模板</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <VinesIcon src={item.iconUrl} size="xl" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold">{item.displayName}</span>
            <span className="text-sm">{item.description}</span>
          </div>
        </div>
        <DialogFooter>
          <Button loading={isLoading} variant="solid" onClick={handleUse}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};