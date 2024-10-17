import React from 'react';

import { useTranslation } from 'react-i18next';

import { IPinPage } from '@/apis/pages/typings.ts';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn, getI18nContent } from '@/utils';

interface IVirtuaWorkbenchMiniViewListItemProps {
  data: IPinPage;
  currentPageId?: string;
  onClick?: (page: IPinPage) => void;
  mini?: boolean;
}

export const VirtuaWorkbenchMiniViewListItem: React.FC<IVirtuaWorkbenchMiniViewListItemProps> = ({
  data,
  currentPageId,
  onClick,
  mini,
}) => {
  const { t } = useTranslation();

  const info = data?.workflow || data?.agent;
  const pageId = data?.id ?? '';

  return (
    <div
      key={pageId}
      className={cn(
        'mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-transparent py-2 transition-colors hover:bg-accent hover:text-accent-foreground',
        currentPageId === pageId && 'border-input bg-background text-accent-foreground',
        mini && 'gap-0 pb-1 pt-0',
      )}
      onClick={() => onClick?.(data)}
    >
      <VinesIcon size="sm" className={cn(mini && 'scale-75')}>
        {info?.iconUrl}
      </VinesIcon>
      <span className="text-xxs text-center" style={mini ? { fontSize: 8 } : {}}>
        {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
      </span>
    </div>
  );
};
