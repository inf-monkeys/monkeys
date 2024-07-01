import React, { useState } from 'react';

import { toast } from 'sonner';

import { IComfyuiWorkflow } from '@/apis/comfyui/typings';
import { forkAssetItem } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesIcon } from '@/components/ui/vines-icon';
import { I18nContent } from '@/utils';

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
          <DialogTitle>导入此工作流</DialogTitle>
        </DialogHeader>
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <VinesIcon src={item.iconUrl} size="lg" />
          </div>
          <div className="flex w-96 flex-col gap-1 overflow-hidden">
            <p className="font-bold">{I18nContent(item.displayName)}</p>
            <p className="break-words text-sm">{I18nContent(item.description)}</p>
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
