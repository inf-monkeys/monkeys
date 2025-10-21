import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AssetContentPreview } from '@/components/layout/ugc/detail/asset-content-preview';
import { IUgcViewItemProps } from '@/components/layout/ugc/typings.ts';
import { useColumnRenderer } from '@/components/layout/ugc/view/utils/node-renderer.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export const UgcViewCard = <E extends object>({
  row,
  columns,
  renderOptions,
  operateArea,
  onItemClick,
  ugcOptions,
}: IUgcViewItemProps<E>) => {
  const { t } = useTranslation();

  const cells = row.getAllCells();

  const render = useColumnRenderer({ row, columns, renderOptions, cells, ugcOptions });

  const logo = render('logo');
  const title = render('title');
  const subtitle = render('subtitle');
  const assetTags = render('assetTags');
  const description = render('description');

  // 判断文件类型的函数
  const getFileType = (): string => {
    const fileName = String(row.original?.name || (row.original as any)?.displayName || '');
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const isTextFile = (): boolean => {
    const fileType = getFileType();
    return ['txt', 'json', 'md', 'csv', 'log', 'xml', 'yaml', 'yml'].includes(fileType);
  };

  const operateAreaNode = operateArea?.(
    row.original,
    <Button icon={<MoreHorizontal />} size="small" variant="outline" className="scale-80 -m-1" />,
    t('common.utils.operate'),
  );

  return (
    <Card
      className={cn('h-52', {
        'cursor-pointer transition-colors hover:bg-neocard active:bg-neocard': !!onItemClick,
        'cursor-default': !onItemClick,
      })}
      onClick={
        onItemClick
          ? (e) => {
              onItemClick(row.original, e);
            }
          : undefined
      }
    >
      <CardHeader className="p-global">
        <CardTitle className={cn('flex gap-3 font-medium', operateAreaNode && 'justify-between')}>
          <div>{logo}</div>
          <div className={cn('flex flex-col', operateAreaNode && 'max-w-[55%]')}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="line-clamp-1 text-base font-bold">{title}</span>
              </TooltipTrigger>
              <TooltipContent>{title}</TooltipContent>
            </Tooltip>
            <span className="text-xs">{subtitle}</span>
          </div>
          {operateAreaNode && (
            <>
              <div className="flex-1" />
              <div>{operateAreaNode}</div>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-global pt-0">
        {assetTags}
        {isTextFile() ? (
          // 文本文件显示内容预览
          <div className="h-20 overflow-hidden">
            <AssetContentPreview asset={row.original} isThumbnail={true} className="h-full w-full" />
          </div>
        ) : (
          // 其他文件显示描述
          <div className="flex flex-col gap-1 text-xs text-opacity-70">
            {description || t('components.layout.ugc.utils.no-description')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
