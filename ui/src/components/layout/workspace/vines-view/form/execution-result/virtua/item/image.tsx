import React, { useCallback } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useAsyncEffect } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isObject } from 'lodash';
import { Copy } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

import { UniImagePreviewWrapper } from '@/components/layout-wrapper/main/uni-image-preview';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils';
import { useCopy } from '@/hooks/use-copy.ts';
import useUrlState from '@/hooks/use-url-state';
import { useExecutionImageResultStore } from '@/store/useExecutionImageResultStore';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

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
}

export function getThumbUrl(url: string) {
  const urlPath = url.split('/');
  const urlPathLength = urlPath.length;
  return urlPath.map((it, i) => (i === urlPathLength - 2 ? `${it}_thumb` : it)).join('/');
}

export const VirtuaExecutionResultGridImageItem: React.FC<IVirtuaExecutionResultGridImageItemProps> = ({
  src,
  alt,
  instanceId,
  outputIndex = 0,
  renderKey,
  isSelectionMode = false,
  onSelect,
  clickBehavior,
  event$,
  data,
  workflowId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { copy } = useCopy();
  const { images, setPosition } = useExecutionImageResultStore();

  const altLabel = isObject(alt) ? alt.label.toString() : alt;

  const altContent = isObject(alt) ? alt.value : alt;
  const [previewSrc, setPreviewSrc] = React.useState(src);
  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  const isMiniFrame = mode === 'mini';
  useAsyncEffect(async () => {
    if (!src) return;
    const thumbnailSrc = getThumbUrl(src);
    if (await checkImageUrlAvailable(thumbnailSrc)) {
      setPreviewSrc(thumbnailSrc);
    } else {
      setPreviewSrc(src);
    }
  }, [src]);

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
          // instanceId: instanceId || '',
          outputIndex,
          mode: isMiniFrame ? 'mini' : '',
        },
      });
    }
    if ((clickBehavior === 'select' || isSelectionMode) && onSelect) {
      onSelect(e);
    }
    if (clickBehavior === 'fill-form' && event$) {
      event$?.emit?.({
        type: 'set',
        data: data.input,
      });
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
    <div className="vines-center relative overflow-hidden rounded-lg">
      <UniImagePreviewWrapper imageUrl={src}>
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
        />
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
