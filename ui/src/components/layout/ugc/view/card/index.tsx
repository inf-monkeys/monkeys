import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
}: IUgcViewItemProps<E>) => {
  const { t } = useTranslation();

  const cells = row.getAllCells();

  const render = useColumnRenderer({ row, columns, renderOptions, cells });

  const logo = render('logo');
  const title = render('title');
  const subtitle = render('subtitle');
  const assetTags = render('assetTags');
  const description = render('description');

  const operateAreaNode = operateArea?.(
    row.original,
    <Button icon={<MoreHorizontal />} size="small" variant="outline" className="scale-80 -m-1" />,
    t('common.utils.operate'),
  );

  return (
    <Card
      className={cn('h-44', {
        'cursor-pointer transition-colors hover:bg-[#F1F5F9] active:bg-[#F1F5F9] dark:hover:bg-[#1D1D1F] active:dark:bg-[#1D1D1F]':
          !!onItemClick,
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
      <CardHeader className="p-4">
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
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        {assetTags}
        <div className="flex flex-col gap-1 text-xs text-opacity-70">
          {description || t('components.layout.ugc.utils.no-description')}
        </div>
      </CardContent>
    </Card>
  );
};
