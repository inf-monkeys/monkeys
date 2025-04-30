import React, { useState } from 'react';

import { Copy } from 'lucide-react';
import 'rc-image/assets/index.css';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { isObject } from 'lodash';
import { useMount } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { VinesLoading } from '@/components/ui/loading';

export type IVinesExecutionResultImageAlt =
  | string
  | {
      label: string;
      value: string;
    };

interface IVirtuaExecutionResultGridImageItemProps {
  src: string;
  alt: IVinesExecutionResultImageAlt;
}

export const VirtuaExecutionResultGridImageItem: React.FC<IVirtuaExecutionResultGridImageItemProps> = ({
  src,
  alt,
}) => {
  const { t } = useTranslation();

  const { copy } = useCopy();

  const altLabel = isObject(alt) ? alt.label : alt;
  const altContent = isObject(alt) ? alt.value : alt;

  const [loadding, setLoading] = useState(true);

  useMount(() => {
    setLoading(false);
  });
  return (
    <div className="vines-center relative overflow-hidden rounded-lg">
      <AnimatePresence>
        {true ? (
          <img
            className="size-full min-h-52 rounded-lg border border-input object-cover object-center shadow-sm"
            src={src}
            alt="image"
            style={{
              objectFit: 'cover',
              width: '100%',
              height: '100%',
            }}
          />
        ) : (
          <>
            <motion.div
              key="vines-image-loading-skeleton"
              className="size-full animate-pulse rounded-md bg-muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <VinesLoading key="vines-image-loading" className="absolute" />
          </>
        )}
      </AnimatePresence>

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
