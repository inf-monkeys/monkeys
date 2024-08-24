import React from 'react';

import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VirtuaToolList } from '@/components/layout/workspace/vines-view/flow/headless-modal/tools-selector/virtua';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

interface IToolListsProps {
  onClick?: (tool: VinesToolDef) => void;
  list: VinesToolDef[];
  length: number;
  category: string;
}

export const ToolLists: React.FC<IToolListsProps> = ({ list, length, category, onClick }) => {
  const { t } = useTranslation();

  const isEmptyList = length === 0;

  return isEmptyList ? (
    <div className="vines-center h-[28.125rem] flex-col gap-2">
      <Inbox size={58} />
      <p className="text-sm">{t('common.load.empty')}</p>
    </div>
  ) : (
    <VirtuaToolList data={list} height={450} rowCount={3} category={category} onItemClicked={onClick} />
  );
};
