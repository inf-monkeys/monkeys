import React, { useCallback, useMemo } from 'react';

import { useNavigate } from '@tanstack/react-router';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { get, isObject } from 'lodash';
import { Copy } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { ExectuionResultGridDisplayType } from '@/apis/common/typings';
import { UniImagePreviewWrapper } from '@/components/layout-wrapper/main/uni-image-preview';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import useUrlState from '@/hooks/use-url-state';
import { useExecutionImageResultStore } from '@/store/useExecutionImageResultStore';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';
import { getThumbUrl } from '@/utils/file';

import { IClickBehavior } from '../../grid/item';

import 'rc-image/assets/index.css';

export type IVinesExecutionResultImageAlt =
  | string
  | {
      label: any;
      value: string;
    };

interface IVirtuaExecutionResultGridImageItemProps {
  src: string;
  alt: IVinesExecutionResultImageAlt;
  instanceId?: string;
  outputIndex?: number;
  renderKey: string;
  isSelectionMode?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
  clickBehavior?: IClickBehavior;
  event$?: EventEmitter<void>;
  data: IVinesExecutionResultItem;
  workflowId?: string;
  displayType?: ExectuionResultGridDisplayType;
}

const thumbnailStatusCache = new Map<string, 'success' | 'error'>();

const VirtuaExecutionResultGridImageItemComponent: React.FC<IVirtuaExecutionResultGridImageItemProps> = ({
  src,
  alt,
  instanceId: _instanceId,
  outputIndex = 0,
  renderKey,
  isSelectionMode = false,
  onSelect,
  clickBehavior,
  event$,
  data: _data,
  workflowId,
  displayType = 'masonry',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { copy } = useCopy();
  const images = useExecutionImageResultStore((state) => state.images);
  const setPosition = useExecutionImageResultStore((state) => state.setPosition);

  const { data: oem } = useSystemConfig();
  const enableSystemImageThumbnail = get(oem, ['theme', 'imageThumbnail'], false);

  const altLabel = isObject(alt) ? alt.label.toString() : alt;

  const altContent = isObject(alt) ? alt.value : alt;
  const thumbUrl = useMemo(() => getThumbUrl(src, enableSystemImageThumbnail), [src, enableSystemImageThumbnail]);
  const [previewSrc, setPreviewSrc] = React.useState(() => {
    if (!enableSystemImageThumbnail) return src;
    return thumbnailStatusCache.get(src) === 'error' ? src : thumbUrl;
  });
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  const isMiniFrame = mode === 'mini';
  React.useEffect(() => {
    const nextSrc = !enableSystemImageThumbnail || thumbnailStatusCache.get(src) === 'error' ? src : thumbUrl;
    setPreviewSrc((prev) => (prev === nextSrc ? prev : nextSrc));
  }, [src, thumbUrl, enableSystemImageThumbnail]);

  const handleImageLoad = useCallback(() => {
    if (previewSrc === src) return;
    thumbnailStatusCache.set(src, 'success');
  }, [previewSrc, src]);

  const handleImageError = useCallback(() => {
    if (previewSrc === src) return;
    if (thumbnailStatusCache.get(src) !== 'error') {
      thumbnailStatusCache.set(src, 'error');
    }
    setPreviewSrc((prev) => (prev === src ? prev : src));
  }, [previewSrc, src]);

  // 处理图片点击，跳转到详情页面
  const handleImageClick = (e: React.MouseEvent) => {
    if (clickBehavior === 'none') return;
    e.stopPropagation();
    if (workflowId && src && clickBehavior === 'preview' && !isSelectionMode) {
      const position = images?.findIndex((image) => image.render.key === renderKey);
      setPosition(position);
      navigate({
        to: '/$teamId/workspace/$workflowId/image-detail/',
        params: {
          // teamId: window['vinesTeamId'],
          workflowId,
        } as any,
        search: {
          // imageUrl: src,
          // instanceId: _instanceId || '',
          outputIndex,
          mode: isMiniFrame ? 'mini' : '',
        },
      });
    }
    if ((clickBehavior === 'select' || isSelectionMode) && onSelect) {
      onSelect(e);
    }
    if (clickBehavior === 'fill-form' && event$) {
      event$?.emit?.();
    }
  };

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLImageElement>) => {
      e.dataTransfer.setData('text/plain', src);
      e.dataTransfer.setData('text/uri-list', src);
    },
    [src],
  );

  return (
    <div
      className={`relative overflow-hidden ${displayType === 'grid' ? 'flex h-full w-full items-center justify-center rounded-lg' : 'vines-center rounded-lg'}`}
    >
      <UniImagePreviewWrapper imageUrl={src}>
        {displayType === 'grid' ? (
          <img
            className="border border-input shadow-sm"
            src={previewSrc}
            alt="image"
            style={{
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              display: 'block',
            }}
            onDragStart={handleDragStart}
            draggable
            onClick={handleImageClick}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <Image
            className="size-full min-h-52 rounded-lg border border-input object-cover object-center shadow-sm"
            src={previewSrc}
            alt="image"
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
            preview={false}
            onDragStart={handleDragStart}
            draggable
            onClick={handleImageClick}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </UniImagePreviewWrapper>

      {altLabel.trim() !== '' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute bottom-2 flex w-[calc(100%-1rem)] items-center justify-between gap-1 rounded border border-input bg-slate-1/80 p-1 shadow backdrop-blur"
              onClick={() => copy(altContent)}
            >
              <p className="truncate text-xs">{altLabel}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button icon={<Copy />} variant="outline" size="small" className="-m-2 scale-[.5] p-1 opacity-80" />
                </TooltipTrigger>
                <TooltipContent>{t('common.utils.copy')}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-h-60 max-w-60 overflow-auto">{altLabel}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

const imageItemAreEqual = (
  prev: IVirtuaExecutionResultGridImageItemProps,
  next: IVirtuaExecutionResultGridImageItemProps,
) => {
  const getAltKey = (alt: IVinesExecutionResultImageAlt) => {
    if (!alt) return '';
    if (typeof alt === 'string') return alt;
    if (isObject(alt) && 'label' in alt && 'value' in alt) {
      return `${(alt as { label?: string }).label ?? ''}||${(alt as { value?: string }).value ?? ''}`;
    }
    return JSON.stringify(alt);
  };
  const isAltEqual = getAltKey(prev.alt) === getAltKey(next.alt);

  return (
    prev.src === next.src &&
    prev.renderKey === next.renderKey &&
    prev.isSelectionMode === next.isSelectionMode &&
    prev.clickBehavior === next.clickBehavior &&
    prev.workflowId === next.workflowId &&
    prev.displayType === next.displayType &&
    isAltEqual &&
    prev.instanceId === next.instanceId &&
    prev.outputIndex === next.outputIndex &&
    prev.onSelect === next.onSelect &&
    prev.event$ === next.event$
  );
};

export const VirtuaExecutionResultGridImageItem = React.memo(
  VirtuaExecutionResultGridImageItemComponent,
  imageItemAreEqual,
);
