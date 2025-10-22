import React from 'react';

import { Folder } from 'lucide-react';

import { AssetContentPreview } from '@/components/layout/ugc/detail/asset-content-preview';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { cn } from '@/utils';

interface IFolderCardProps {
  folderName: string;
  assetCount: number;
  lastUpdated: string;
  previewImages: string[];
  previewAssets?: any[]; // 新增：预览资产对象数组
  onClick?: () => void;
}

export const UgcViewFolderCard: React.FC<IFolderCardProps> = ({
  folderName,
  assetCount,
  lastUpdated,
  previewImages,
  previewAssets,
  onClick,
}) => {
  // 判断文件类型的函数
  const getFileType = (asset: any): string => {
    const fileName = String(asset?.name || asset?.displayName || '');
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const isTextFile = (asset: any): boolean => {
    const fileType = getFileType(asset);
    return ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(fileType);
  };

  const isImageFile = (asset: any): boolean => {
    const fileType = getFileType(asset);
    return asset?.type?.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileType);
  };

  return (
    <Card
      className={cn('h-80 cursor-pointer transition-colors hover:bg-neocard active:bg-neocard', {
        'cursor-pointer': !!onClick,
        'cursor-default': !onClick,
      })}
      style={{ height: '24rem' }}
      onClick={onClick}
    >
      <CardHeader className="p-global">
        <div className="flex items-start gap-3">
          <Folder className="mt-1 h-6 w-6 flex-shrink-0 text-gray-400" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="truncate text-lg font-bold text-gray-900">{folderName}</h3>
            <p className="text-sm text-gray-500">
              {assetCount}个资产 更新于{lastUpdated}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-global pt-0">
        <div className="grid grid-cols-2 grid-rows-2 gap-1">
          {(previewAssets || []).slice(0, 4).map((asset, index) => {
            if (isTextFile(asset)) {
              // 文本文件使用 AssetContentPreview 组件
              return (
                <div key={index} className="overflow-hidden rounded-md bg-gray-100" style={{ aspectRatio: '16/9' }}>
                  <AssetContentPreview asset={asset} isThumbnail={true} className="h-full w-full" />
                </div>
              );
            } else if (isImageFile(asset) && (asset.url || asset.iconUrl)) {
              // 图片文件显示图片，优先使用 iconUrl（缩略图）
              const imageUrl = asset.iconUrl || asset.url;
              return (
                <div key={index} className="overflow-hidden rounded-md bg-gray-100" style={{ aspectRatio: '16/9' }}>
                  <img src={imageUrl} alt={`${folderName} 预览 ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              );
            } else {
              // 其他文件类型或回退到原来的图片显示
              const imageUrl = previewImages[index];
              return (
                <div key={index} className="overflow-hidden rounded-md bg-gray-100" style={{ aspectRatio: '16/9' }}>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={`${folderName} 预览 ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              );
            }
          })}
        </div>
      </CardContent>
    </Card>
  );
};
