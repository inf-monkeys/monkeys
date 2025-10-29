import React from 'react';

import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NON_FILTER_TYPE_LIST } from '@/components/layout/ugc/consts.ts';
import { IUgcCustomProps } from '@/components/layout/ugc/typings.ts';
import { IUgcViewFilterButtonProps, UgcViewFilterButton } from '@/components/layout/ugc/view/filter/button';
import { UgcHeaderDisplayModeButton } from '@/components/layout/ugc/view/header/display-mode.tsx';
import { UgcHeaderSortButton } from '@/components/layout/ugc/view/header/sort.tsx';
import { Input } from '@/components/ui/input';

interface IUgcViewHeaderProps extends IUgcCustomProps {
  subtitle?: React.ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  filterButtonProps: Omit<IUgcViewFilterButtonProps, keyof IUgcCustomProps>;
  showSearch?: boolean;
}

export const UgcViewHeader: React.FC<IUgcViewHeaderProps> = ({
  assetKey,
  assetType,
  isMarket,
  filterButtonProps,
  subtitle,
  search,
  onSearchChange,
  showSearch,
}) => {
  const { t } = useTranslation();
  const filterAreaVisible = !NON_FILTER_TYPE_LIST.includes(assetType) && !isMarket;
  const searchVisible = showSearch ?? filterAreaVisible;

  return (
    <header className="flex w-full items-center justify-between px-global pb-2">
      {searchVisible && (
        <div className="relative w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder={t('common.utils.search', { defaultValue: '搜索' })}
            value={search ?? ''}
            onChange={(value) => onSearchChange?.(value)}
            className="pl-10"
          />
        </div>
      )}
      <div className="ml-auto flex gap-2">
        <UgcHeaderDisplayModeButton assetKey={assetKey} />
        {filterAreaVisible && <UgcHeaderSortButton assetKey={assetKey} assetType={assetType} />}
        {filterAreaVisible && <UgcViewFilterButton assetKey={assetKey} assetType={assetType} {...filterButtonProps} />}
        {subtitle}
      </div>
    </header>
  );
};
