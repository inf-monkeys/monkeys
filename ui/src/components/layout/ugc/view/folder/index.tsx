import React from 'react';

import { Clock, Folder } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { cn } from '@/utils';

interface IFolderCardProps {
  folderName: string;
  assetCount: number;
  lastUpdated: string;
  previewImages: string[];
  onClick?: () => void;
}

export const UgcViewFolderCard: React.FC<IFolderCardProps> = ({
  folderName,
  assetCount,
  lastUpdated,
  previewImages,
  onClick,
}) => {
  return (
    <Card
      className={cn('h-80 cursor-pointer transition-colors hover:bg-neocard active:bg-neocard', {
        'cursor-pointer': !!onClick,
        'cursor-default': !onClick,
      }) } style={{ height: '24rem' }}
      onClick={onClick}
    >
      <CardHeader className="p-global">
        <div className="flex items-start gap-3">
          <Folder className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-900 truncate">{folderName}</h3>
            <p className="text-sm text-gray-500">{assetCount}个资产 更新于{lastUpdated}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-global pt-0">
         <div className="grid grid-cols-2 grid-rows-2 gap-1">
          {previewImages.slice(0, 4).map((image, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-md overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {image && (
                <img
                  src={image}
                  alt={`${folderName} 预览 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};