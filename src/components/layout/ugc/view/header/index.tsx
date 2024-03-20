import React from 'react';

import { KeyedMutator } from 'swr';

import { RefreshCw } from 'lucide-react';

import { IAssetCustomProps } from '@/components/layout/ugc/typings.ts';
import { UgcHeaderDisplayModeButton } from '@/components/layout/ugc/view/header/display-mode.tsx';
import { UgcHeaderSortButton } from '@/components/layout/ugc/view/header/sort.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';

interface IUgcViewHeaderProps extends IAssetCustomProps {
  assetKey: string;
  subtitle?: React.ReactNode;
  mutate?: KeyedMutator<any>;
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({ assetKey, subtitle, mutate }) => {
  return (
    <header className="flex w-full items-center justify-end px-4 pb-2">
      <div className="flex gap-2">
        {mutate && (
          <Tooltip content="刷新">
            <TooltipTrigger asChild>
              <Button
                icon={<RefreshCw />}
                onClick={() => {
                  mutate();
                }}
              />
            </TooltipTrigger>
          </Tooltip>
        )}
        <UgcHeaderDisplayModeButton assetKey={assetKey} />
        <UgcHeaderSortButton assetKey={assetKey} />
        {subtitle}
      </div>
    </header>
  );
};
