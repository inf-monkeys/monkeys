import React, { useEffect, useRef, useState } from 'react';

import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IDesignBoardMetadata, IDesignProject } from '@/apis/designs/typings';
import { IAssetItem } from '@/apis/ugc/typings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [isImgInView, setIsImgInView] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    onItemClick?.(project);
  };

  const operateAreaNode = operateArea?.(
    project,
    <Button icon={<MoreHorizontal />} size="small" variant="outline" className="scale-80 -m-1" />,
    t('common.utils.operate'),
  );

  // 使用 Intersection Observer 延迟加载缩略图
  useEffect(() => {
    if (!firstBoard?.thumbnailUrl || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isImgInView) {
            setIsImgInView(true);
          }
        });
      },
      {
        root: null,
        rootMargin: '100px', // 提前100px加载图片
        threshold: 0.01,
      },
    );

    const currentRef = imgRef.current;
    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [firstBoard?.thumbnailUrl, isImgInView]);

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
          {firstBoard?.thumbnailUrl && !imgError ? (
            <>
              {/* 骨架屏 - 加载中显示 */}
              {!imgLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}

              {/* 实际图片 */}
              <img
                ref={imgRef}
                src={isImgInView ? firstBoard.thumbnailUrl : undefined}
                alt={`${getI18nContent(firstBoard.displayName)} - 第1页预览`}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                onError={() => {
                  setImgError(true);
                  setImgLoaded(true);
                }}
              />
            </>
          ) : (
            // 无缩略图或加载失败时显示默认图标
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <VinesIcon size="lg" src={project.iconUrl || DEFAULT_DESIGN_PROJECT_ICON_URL} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
