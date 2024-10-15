import React from 'react';

import { Copy, Eye } from 'lucide-react';
import Image from 'rc-image';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IVirtuaExecutionResultGridImageItemProps {
  src: string;
  alt?: string;
}

export const VirtuaExecutionResultGridImageItem: React.FC<IVirtuaExecutionResultGridImageItemProps> = ({
  src,
  alt,
}) => {
  const { copy } = useCopy();

  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const isDarkMode = mode === 'dark';

  return (
    <div className="box-border flex-none content-stretch p-1">
      <div className="vines-center relative overflow-hidden rounded-lg">
        <Image
          src={src}
          alt="image"
          className="aspect-square size-full transform rounded-lg border border-input object-cover object-center shadow-sm"
          loading="lazy"
          fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
          preview={{
            mask: <Eye className="stroke-white" />,
          }}
        />

        {alt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute bottom-2 flex w-[calc(100%-1rem)] items-center gap-1 rounded bg-white/80 p-1 backdrop-blur"
                onClick={() => copy(alt)}
              >
                <p className="truncate text-xs">{alt}</p>
                <Button icon={<Copy />} variant="outline" size="small" className="-m-2 scale-[.5] p-1" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-96">{alt}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
