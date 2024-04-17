import React, { useEffect, useState } from 'react';

import { AssetType } from '@inf-monkeys/vines';
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
  const { name: rawName, description, assetType, iconUrl, prevName } = item;

  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(rawName ?? '');

  useEffect(() => {
    visible && rawName && setName(rawName);
  }, [visible]);

  const handlePublish = async () => {
    if (!ugcId || !assetType) {
      toast.error('请刷新页面后重试');
      return;
    }
    setIsLoading(true);
    toast.promise(
      publishAssetItem(
        assetType,
        ugcId,
        assetType === 'text-collection'
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
          return '发布成功';
        },
        error: '发布失败，请检查网络后重试',
        loading: '发布中......',
      },
    );
    setIsLoading(false);
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>发布到市场</DialogTitle>
        </DialogHeader>
        <div className="gap-4 py-4">
          <Input placeholder="请输入名称" maxLength={50} value={name} onChange={setName} autoFocus />
        </div>
        <DialogFooter>
          <Button loading={isLoading} variant="solid" onClick={handlePublish}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
