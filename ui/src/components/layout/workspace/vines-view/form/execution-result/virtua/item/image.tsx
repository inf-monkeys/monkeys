import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useAsyncEffect } from 'ahooks';
import { isObject } from 'lodash';
import { Copy } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { checkImageUrlAvailable } from '@/components/ui/vines-image/utils';
import { useCopy } from '@/hooks/use-copy.ts';
import { useExecutionImageResultStore } from '@/store/useExecutionImageResultStore';
import { useFlowStore } from '@/store/useFlowStore';

import 'rc-image/assets/index.css';

export type IVinesExecutionResultImageAlt =
  | string
  | {
    label: string;
    value: string;
  };

interface IVirtuaExecutionResultGridImageItemProps {
  src: string;
  alt: IVinesExecutionResultImageAlt;
  instanceId?: string;
  outputIndex?: number;
}

function getThumbUrl(url: string) {
  const urlPath = url.split('/');
  const urlPathLength = urlPath.length;
  return urlPath.map((it, i) => (i === urlPathLength - 2 ? `${it}_thumb` : it)).join('/');
}

export const VirtuaExecutionResultGridImageItem: React.FC<IVirtuaExecutionResultGridImageItemProps> = ({
  src,
  alt,
  instanceId,
  outputIndex = 0,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { copy } = useCopy();
  const workflowId = useFlowStore((s) => s.workflowId);
  const { images, setPosition } = useExecutionImageResultStore();

  const altLabel = isObject(alt) ? alt.label : alt;
  const altContent = isObject(alt) ? alt.value : alt;
  const [previewSrc, setPreviewSrc] = React.useState(src);
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
    e.stopPropagation();
    if (workflowId && src) {
      const position = images?.findIndex((image) => (image.render.data as string) === src);
      setPosition(position);
      navigate({
        to: '/$teamId/workspace/$workflowId/image-detail/',
        params: {
          teamId: window['vinesTeamId'],
          workflowId,
        },
        search: {
          imageUrl: src,
          instanceId: instanceId || '',
          outputIndex,
        },
      });
    }
  };

  return (
    <div className="vines-center relative overflow-hidden rounded-lg">
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
        onClick={handleImageClick}
      />

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
