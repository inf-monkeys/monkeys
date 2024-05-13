import React, { useMemo } from 'react';

import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IUgcViewItemProps } from '@/components/layout/ugc/typings.ts';
import { getRenderNodeFn } from '@/components/layout/ugc/view/utils/node-renderer.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export const UgcViewCard = <E extends object>({
  row,
  columns,
  index,
  renderOptions,
  operateArea,
  onItemClick,
}: IUgcViewItemProps<E>) => {
  const { t } = useTranslation();

  const getRenderNode = getRenderNodeFn({
    row,
    columns,
    renderOptions,
  });

  const logo = useMemo(() => getRenderNode('logo'), [index, row]);
  const title = useMemo(() => getRenderNode('title'), [index, row]);
  const subtitle = useMemo(() => getRenderNode('subtitle'), [index, row]);
  const tags = useMemo(() => getRenderNode('assetTags'), [index, row]);
  const description = useMemo(
    () => getRenderNode('description') || t('components.layout.ugc.utils.no-description'),
    [index, row],
  );
  return (
    <Card
      className={cn('h-44', {
        'cursor-pointer transition-colors hover:bg-[--bg-hover-color]': !!onItemClick,
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
        <CardTitle className={cn('flex gap-3 font-medium', operateArea && 'justify-between')}>
          <div>{logo}</div>
          <div className={cn('flex flex-col', operateArea && 'max-w-[55%]')}>
            <Tooltip content={title}>
              <TooltipTrigger asChild>
                <span className="line-clamp-1 text-base font-bold">{title}</span>
              </TooltipTrigger>
            </Tooltip>
            <span className="text-xs">{subtitle}</span>
          </div>
          {operateArea && (
            <>
              <div className="flex-1" />
              <div>
                {operateArea(
                  row.original,
                  <Button icon={<MoreHorizontal />} size="small" variant="outline" className="-m-1 scale-80" />,
                  t('common.utils.operate'),
                )}
              </div>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        {tags}
        <div className="flex flex-col gap-1 text-xs text-opacity-70">{description}</div>
      </CardContent>
    </Card>
  );
};
