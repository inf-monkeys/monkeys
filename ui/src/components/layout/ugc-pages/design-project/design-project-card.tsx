import React from 'react';

import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IDesignBoardMetadata, IDesignProject } from '@/apis/designs/typings';
import { IAssetItem } from '@/apis/ugc/typings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_DESIGN_PROJECT_ICON_URL } from '@/consts/icons';
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time';

interface DesignProjectCardProps {
  project: IAssetItem<IDesignProject>;
  firstBoard?: IDesignBoardMetadata;
  onItemClick?: (project: IAssetItem<IDesignProject>) => void;
  operateArea?: (
    item: IAssetItem<IDesignProject>,
    trigger: React.ReactNode,
    tooltipTriggerContent?: string,
  ) => React.ReactNode;
}

export const DesignProjectCard: React.FC<DesignProjectCardProps> = ({
  project,
  firstBoard,
  onItemClick,
  operateArea,
}) => {
  const { t } = useTranslation();

  const handleClick = () => {
    onItemClick?.(project);
  };

  const operateAreaNode = operateArea?.(
    project,
    <Button icon={<MoreHorizontal />} size="small" variant="outline" className="scale-80 -m-1" />,
    t('common.utils.operate'),
  );

  console.log(firstBoard?.thumbnailUrl);

  return (
    <Card
      className="flex h-64 cursor-pointer flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      onClick={handleClick}
    >
      {/* 顶部：画板标题和更新时间 */}
      <CardHeader className="flex-shrink-0 pb-2">
        <div className="flex items-center gap-2">
          <VinesIcon size="sm" src={project.iconUrl || DEFAULT_DESIGN_PROJECT_ICON_URL} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{getI18nContent(project.displayName)}</h3>
            <p className="text-xs text-muted-foreground">
              {firstBoard ? `${getI18nContent(firstBoard.displayName)} (第1页)` : t('common.utils.unknown')} ·{' '}
              {t('common.utils.updated-at', {
                time: formatTimeDiffPrevious(firstBoard?.updatedTimestamp || project.updatedTimestamp),
              })}
            </p>
          </div>
          {operateAreaNode && <div onClick={(e) => e.stopPropagation()}>{operateAreaNode}</div>}
        </div>
      </CardHeader>

      {/* 中间：第一个页面缩略图（固定大小） */}
      <CardContent className="flex flex-1 flex-col px-3 pb-2">
        <div className="relative h-40 w-full overflow-hidden rounded-md border">
          {firstBoard?.thumbnailUrl
            ? // <img
              //   src={firstBoard.thumbnailUrl}
              //   alt={`${getI18nContent(firstBoard.displayName)} - 第1页预览`}
              //   className="h-full w-full object-cover"
              //   onError={(e) => {
              //     // 缩略图加载失败时显示默认图标
              //     const target = e.target as HTMLImageElement;
              //     target.style.display = 'none';
              //     const fallback = target.nextElementSibling as HTMLElement;
              //     if (fallback) fallback.style.display = 'flex';
              //   }}
              // />
              null
            : null}

          <div
            className={`flex h-full w-full items-center justify-center bg-muted ${
              firstBoard?.thumbnailUrl ? 'hidden' : 'flex'
            }`}
          >
            <VinesIcon size="lg" src={project.iconUrl || DEFAULT_DESIGN_PROJECT_ICON_URL} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
