import React from 'react';

import { NON_FILTER_TYPE_LIST } from '@/components/layout/ugc/consts.ts';
import { IUgcCustomProps } from '@/components/layout/ugc/typings.ts';
import { IUgcViewFilterButtonProps, UgcViewFilterButton } from '@/components/layout/ugc/view/filter/button';
import { UgcHeaderDisplayModeButton } from '@/components/layout/ugc/view/header/display-mode.tsx';
import { UgcHeaderSortButton } from '@/components/layout/ugc/view/header/sort.tsx';

interface IUgcViewHeaderProps extends IUgcCustomProps {
  subtitle?: React.ReactNode;
  filterButtonProps: Omit<IUgcViewFilterButtonProps, keyof IUgcCustomProps>;
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({ assetKey, assetType, filterButtonProps, subtitle }) => {
  const filterAreaVisible = !NON_FILTER_TYPE_LIST.includes(assetType);

  return (
    <header className="flex w-full items-center justify-end px-4 pb-2">
      <div className="flex gap-2">
        <UgcHeaderDisplayModeButton assetKey={assetKey} />
        <UgcHeaderSortButton assetKey={assetKey} assetType={assetType} />
        {filterAreaVisible && <UgcViewFilterButton assetKey={assetKey} assetType={assetType} {...filterButtonProps} />}
        {subtitle}
      </div>
    </header>
  );
};
