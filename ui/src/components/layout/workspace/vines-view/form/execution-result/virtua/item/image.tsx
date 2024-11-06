import React from 'react';

import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesImage } from '@/components/ui/vines-image';
import { useCopy } from '@/hooks/use-copy.ts';

interface IVirtuaExecutionResultGridImageItemProps {
  src: string;
  alt?: string;
}

export const VirtuaExecutionResultGridImageItem: React.FC<IVirtuaExecutionResultGridImageItemProps> = ({
  src,
  alt,
}) => {
  const { t } = useTranslation();

  const { copy } = useCopy();

  return (
    <div className="box-border flex-none content-stretch p-1">
      <div className="vines-center relative overflow-hidden rounded-lg [&_.rc-image-mask]:absolute [&_.rc-image-mask]:h-full [&_.rc-image]:static">
        <VinesImage
          className="aspect-square size-full transform rounded-lg border border-input object-cover object-center shadow-sm"
          src={src}
          alt="image"
        />

        {alt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute bottom-2 flex w-[calc(100%-1rem)] items-center justify-between gap-1 rounded border border-input bg-slate-1/80 p-1 shadow backdrop-blur"
                onClick={() => copy(alt)}
              >
                <p className="truncate text-xs">{alt}</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button icon={<Copy />} variant="outline" size="small" className="-m-2 scale-[.5] p-1 opacity-80" />
                  </TooltipTrigger>
                  <TooltipContent>{t('common.utils.copy')}</TooltipContent>
                </Tooltip>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-h-60 max-w-60 overflow-auto">{alt}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
